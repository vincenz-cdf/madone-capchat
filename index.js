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

    const sqlCheck = 'SELECT * FROM user WHERE username = ?';
    connection.query(sqlCheck, [username], async function (err, results) {
        if (err) throw err;

        if (results.length > 0) {
            const comparison = await bcrypt.compare(password, results[0].password)
            if (comparison) {
                const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: 3600 });
                res.cookie('authToken', token, { httpOnly: true, sameSite: 'strict' });
                res.status(200).send({ auth: true, success: true, redirect: '/profile' });
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


app.post('/register', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = bcrypt.hashSync(req.body.password, 8);

    connection.query('INSERT INTO user (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (error, results, fields) {
        if (error) {
            res.send({ success: false, message: error.sqlMessage });
        } else {
            res.send({ success: true, message: "User registered successfully!" });
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
    const sqlFalse = 'SELECT * FROM image WHERE singular = false ORDER BY RAND() LIMIT 7';
    const sqlTrue = 'SELECT * FROM image WHERE singular = true ORDER BY RAND() LIMIT 1';
    connection.query(sqlFalse, function (err, resultsFalse) {
        if (err) throw err;
        connection.query(sqlTrue, function (err, resultsTrue) {
            if (err) throw err;
            let combinedResults = resultsFalse.concat(resultsTrue);
            combinedResults.sort(() => Math.random() - 0.5);
            res.json({ hint: resultsTrue[0].hint, images: combinedResults });
        });
    });
});


app.post('/capchat/check', (req, res) => {
    const sqlCheck = 'SELECT singular FROM image WHERE id = ?';
    connection.query(sqlCheck, [req.body.id], function (err, results) {
        if (err) throw err;
        if (results[0].singular) {
            res.json({ redirect: '/login' });
        } else {
            res.json({ singular: false });
        }
    });
});

app.get('/capchats', (req, res) => {
    const query = `
        SELECT 
        image_sets.id,
        image_sets.name,
        theme.id as theme_id,
        theme.label,
        user.username,
        (SELECT path FROM image WHERE image_sets_id = image_sets.id LIMIT 1) as thumbnail,
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

    connection.query(query, function (err, results) {
        if (err) throw err;
        results = results.map(result => {
            return {
                id: result.id,
                name: result.name,
                theme_id: result.theme_id,
                theme: result.label,
                username: result.username,
                thumbnail: result.thumbnail,
                count: result.count,
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

app.post('/imageset', async (req, res, next) => {

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        let setId = null;
        //if set_id != null
        await new Promise((resolve, reject) => {
            connection.query('INSERT INTO image_sets (user_id, name, theme_id) VALUES (?, ?, ?)', [fields.user_id, fields.set_name, fields.theme_id], function (error, results, fields) {
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

            // Use fields.theme_id as the folder name
            const folder = hint ? `./resources/${setId}/singuliers` : `./resources/${setId}/neutres`;

            const newPath = path.join(__dirname, folder, file.name);

            fs.mkdir(path.dirname(newPath), { recursive: true }, (err) => {
                if (err) {
                    console.log(err);
                    return;
                }

                // Then move the file
                fs.rename(file.path, newPath, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
            });

            const insertPath = hint ? "/resources/" + setId + "/singuliers/" + file.name : "/resources/" + setId + "/neutres/" + file.name
            connection.query('INSERT INTO image (image_sets_id, singular, path, hint) VALUES (?, ?, ?, ?)', [
                setId, 
                hint ? true : false, 
                insertPath,
                hint
            ], function (error, results, fields) {
            });
        }

        res.json({ fields: fields, files: files });
    });
});



app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.listen(3000, () => console.log('Server started'));
