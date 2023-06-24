const formidable = require('formidable');
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const fs = require('fs');

require('dotenv').config();


const verifyToken = require('./middleware');

const app = express();
app.use(express.json());
var corsOptions = {
    origin: 'http://localhost:4200', // or your angular app's origin
    credentials: true
}

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'capchat'
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const sqlCheck = 'SELECT * FROM user WHERE email = ?';
    connection.query(sqlCheck, [username], async function (err, results) {
        if (err) throw err;

        if (results.length > 0) {
            const comparison = await bcrypt.compare(password, results[0].password)
            if (comparison) {
                const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: 3600 });
                res.cookie('authToken', token, { httpOnly: true, sameSite: 'strict' });
                res.status(200).send({ auth: true, success: true, redirect: '/' });
            } else {
                res.send({ auth: false, message: 'Identifiant ou mdp invalide', success: false });
            }
        } else {
            res.send({ auth: false, message: 'Identifiant ou mdp invalide', success: false });
        }
    });
});

app.get('/currentUser', verifyToken, (req, res) => {
    const userId = req.userId;
    const sqlCheck = 'SELECT id, username, email FROM user WHERE id = ?';
    connection.query(sqlCheck, [userId], function (err, results) {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.post('/users', (req, res) => {
    const sqlCheck = 'SELECT id, username, email FROM user WHERE id != 1 AND id != ?';
    connection.query(sqlCheck, [req.body.id], function (err, results) {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/users/:id', (req, res) => {
    const id = req.params.id;
    const username = req.body.username;
    const email = req.body.email;

    const sqlCheck = 'UPDATE user SET username = ?, email = ? where id = ?';
    connection.query(sqlCheck, [username, email, id], function (err, results) {
        if (err) throw err;
        res.json(results);
    });
});


app.post('/register', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = bcrypt.hashSync(req.body.password, 8);

    const sqlCheck = 'SELECT * FROM user WHERE email = ?';
    connection.query(sqlCheck, [email], function(err, results) {
        if (err) throw err;

        if (results.length > 0) {
            res.send({ success: false, message: 'Email already registered' });
        } else {
            connection.query('INSERT INTO user (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (error, results, fields) {
                if (error) {
                    res.send({ success: false, message: error.sqlMessage });
                } else {
                    res.send({ success: true, message: "User registered successfully!" });
                }
            });
        }
    });
});


app.get('/isAuthenticated', verifyToken, (req, res) => {
    res.status(200).send({ isAuthenticated: true });
});


app.get('/capchat/:id', (req, res) => {
    const id = req.params.id;

    const sqlFalse = 'SELECT * FROM image WHERE image_sets_id = ? AND singular = false ORDER BY RAND() LIMIT 7';
    const sqlTrue = 'SELECT * FROM image WHERE image_sets_id = ? AND singular = true ORDER BY RAND() LIMIT 1';
    connection.query(sqlFalse, [id], function (err, resultsFalse) {
        if (err) throw err;
        connection.query(sqlTrue, [id], function (err, resultsTrue) {
            if (err) throw err;
            let combinedResults = resultsFalse.concat(resultsTrue);
            combinedResults.sort(() => Math.random() - 0.5);
            res.json({ hint: resultsTrue[0].hint, images: combinedResults });
        });
    });
});

app.post('/capchat/newSet', (req, res) => {
    const sqlFalse = 'SELECT * FROM image WHERE singular = false AND image_sets_id = ? ORDER BY RAND() LIMIT 7';
    const sqlTrue = 'SELECT * FROM image WHERE singular = true AND image_sets_id = ? ORDER BY RAND() LIMIT 1';
    connection.query(sqlFalse, [req.body.id], function (err, resultsFalse) {
        if (err) throw err;
        connection.query(sqlTrue, [req.body.id], function (err, resultsTrue) {
            if (err) throw err;
            let combinedResults = resultsFalse.concat(resultsTrue);
            combinedResults.sort(() => Math.random() - 0.5);
            res.json({ hint: resultsTrue[0].hint, images: combinedResults });
        });
    });
});


app.post('/capchat/check', async (req, res) => {
    let destinationUrl = '/';

    await new Promise((resolve, reject) => {
        connection.query('select destination_url from image_sets where id = ?', [req.body.image_sets_id], function (error, results) {
            if (error) {
                reject(error);
            } else {
                // Make sure to pull out the destination_url from the first result
                if (results.length > 0) {
                    destinationUrl = results[0].destination_url;
                }
                resolve();
            }
        });
    });

    const sqlCheck = 'SELECT singular FROM image WHERE id = ?';
    connection.query(sqlCheck, [req.body.id], function (err, results) {
        if (err) throw err;
        if (results[0].singular) {
            res.json({ singular: true, url: destinationUrl });
        } else {
            res.json({ singular: false, url: "" });
        }
    });
});


app.get('/capchats/:filter', (req, res) => {
    let query = `
        SELECT 
        image_sets.id,
        image_sets.name,
        image_sets.destination_url,
        theme.id as theme_id,
        theme.label,
        user.username,
        (SELECT path FROM image WHERE image_sets_id = image_sets.id ORDER BY RAND() LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM image WHERE image_sets_id = image_sets.id) as count
    FROM 
        image_sets 
    INNER JOIN 
        user 
    ON 
        image_sets.user_id = user.id
    INNER JOIN
        theme
    ON
        image_sets.theme_id = theme.id;

    `;

    if (req.params.filter == 'category') {
        query = `
        SELECT 
        theme.id as theme_id,
        theme.label,
        COUNT(image_sets.id) as image_sets_count,
        (SELECT path FROM image WHERE image_sets_id = MIN(image_sets.id) ORDER BY RAND() LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM image 
         INNER JOIN image_sets as is2 ON image.image_sets_id = is2.id 
         WHERE is2.theme_id = theme.id) as count
        FROM 
            image_sets 
        INNER JOIN 
            user 
        ON 
            image_sets.user_id = user.id
        INNER JOIN
            theme
        ON
            image_sets.theme_id = theme.id
        GROUP BY
            theme.id, theme.label;
    
        `

    }

    connection.query(query, function (err, results) {
        if (err) throw err;
        results = results.map(result => {
            return {
                id: result.id,
                name: result.name,
                destination_url: result.destination_url,
                theme_id: result.theme_id,
                theme: result.label,
                username: result.username,
                thumbnail: result.thumbnail,
                count: result.count,
                image_sets_count: result.image_sets_count
            };
        });
        res.json(results);
    });
});

app.get('/themes', (req, res) => {
    const query = `
        SELECT * FROM theme;
    `;

    connection.query(query, function (err, results) {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/imageset/:id/images', (req, res) => {
    const query = `
        SELECT * FROM image where image_sets_id = ?;
    `;

    connection.query(query, [req.params.id], function (err, results) {
        if (err) throw err;
        res.json(results);
    });

});

app.get('/imageset/theme/:themeId/images', (req, res) => {
    const query = `
    SELECT 
        image.*
    FROM 
        image 
    INNER JOIN 
        image_sets 
    ON 
        image.image_sets_id = image_sets.id
    WHERE 
        image_sets.theme_id = ?;
    `;

    connection.query(query, [req.params.themeId], function (err, results) {
        if (err) throw err;
        res.json(results);
    });

});

app.post('/imageset', async (req, res, next) => {

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        if (fields.image_sets_id != 'null') {
            // Update existing image sets
            await new Promise((resolve, reject) => {
                connection.query('UPDATE image_sets SET user_id = ?, name = ?, theme_id = ?, destination_url = ? WHERE id = ?',
                    [fields.user_id, fields.set_name, fields.theme_id, fields.destination_url, fields.image_sets_id], function (error, results) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
            });

            // Update existing images
            for (let fileKey in files) {
                const file = files[fileKey];
                const hint = fields[fileKey.replace('file', 'hint')];
                const imageId = fields[fileKey.replace('file', 'imageId')];

                // Use fields.theme_id as the folder name
                const folder = hint ? `./resources/${fields.image_sets_id}/singuliers` : `./resources/${fields.image_sets_id}/neutres`;

                const newPath = path.join(__dirname, folder, file.name);

                fs.rename(file.path, newPath, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });

                const updatePath = hint ? "/resources/" + fields.image_sets_id + "/singuliers/" + file.name : "/resources/" + fields.image_sets_id + "/neutres/" + file.name;

                await new Promise((resolve, reject) => {
                    connection.query('UPDATE image SET singular = ?, path = ?, hint = ? WHERE image_sets_id = ? AND id = ?', [
                        hint ? true : false,
                        updatePath,
                        hint,
                        fields.image_sets_id,
                        imageId
                    ], function (error, results, fields) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            }

        } else {
            let setId = null;
            await new Promise((resolve, reject) => {
                connection.query('INSERT INTO image_sets (user_id, name, theme_id, destination_url) VALUES (?, ?, ?, ?)', [fields.user_id, fields.set_name, fields.theme_id, fields.destination_url], function (error, results) {
                    if (error) {
                        reject(error);
                    } else {
                        setId = results.insertId; // Changed from const setId to setId
                        resolve();
                    }
                });
            });

            for (let fileKey in files) {
                const file = files[fileKey];
                const hint = fields[fileKey.replace('file', 'hint')];

                // Use setId as the folder name
                const folder = hint ? `./resources/${setId}/singuliers` : `./resources/${setId}/neutres`;

                const newPath = path.join(__dirname, folder, file.name);

                // Create the target directory if it doesn't exist
                await fs.promises.mkdir(path.dirname(newPath), { recursive: true }).catch(console.error);

                // Then move the file
                await fs.promises.rename(file.path, newPath).catch(console.error);

                const insertPath = hint ? "/resources/" + setId + "/singuliers/" + file.name : "/resources/" + setId + "/neutres/" + file.name
                connection.query('INSERT INTO image (image_sets_id, singular, path, hint) VALUES (?, ?, ?, ?)', [
                    setId,
                    hint ? true : false,
                    insertPath,
                    hint
                ], function (error, results) {
                    if (error) {
                        console.error(error);
                    }
                });
            }
        }


        res.json({ fields: fields, files: files });
    });
});

app.delete('/imageset/:id', (req, res) => {
    const setId = req.params.id;

    // Start transaction
    connection.beginTransaction(function(err) {
        if (err) { throw err; }

        // Delete images where image_sets_id = setId
        connection.query('DELETE FROM image WHERE image_sets_id = ?', [setId], function(err, result) {
            if (err) { 
                // If an error occurred, rollback the transaction
                connection.rollback(function() {
                    throw err;
                });
            }

            // Delete image set where id = setId
            connection.query('DELETE FROM image_sets WHERE id = ?', [setId], function(err, result) {
                if (err) { 
                    // If an error occurred, rollback the transaction
                    connection.rollback(function() {
                        throw err;
                    });
                }  
                deleteDirectory(__dirname + '/resources/' + setId)
                connection.commit(function(err) {
                    if (err) { 
                        connection.rollback(function() {
                            throw err;
                        });
                    }
                    res.send({success: true, message: "Image set and its images deleted successfully!"});
                });
            });
        });
    });
});

function deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const currentPath = path.join(dirPath, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                // Recurse if the current path is a directory
                deleteDirectory(currentPath);
            } else {
                // Delete file
                fs.unlinkSync(currentPath);
            }
        });
        // Delete directory
        fs.rmdirSync(dirPath);
    } else {
        console.log('Directory path ' + dirPath + ' not found.');
    }
}


app.post('/theme', (req, res) => {
    const name = req.body.name;
    connection.query('INSERT INTO theme (label) VALUES (?)', [name], function (error, results, fields) {
        if (error) {
            res.send({ success: false, message: error.sqlMessage });
        } else {
            res.send({ success: true, message: "Theme create!" });
        }
    });
});

app.post('/logout', (req, res) => {
    res.clearCookie('authToken', { path: '/', domain: 'http://localhost:3000' }); // replace 'your-domain.com' with your actual domain
    res.status(200).send({ success: true, message: "Logged out" });
});



app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.listen(3000, () => console.log('Server started' + __dirname));
