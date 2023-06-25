const fs = require('fs');
const path = require('path');
const formidable = require('formidable'); // assuming this is a package you're using

module.exports = function(app, connection) {

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

    app.get('/themes', (req, res) => {
        const query = `
        SELECT * FROM theme;
    `;

        connection.query(query, function (err, results) {
            if (err) throw err;
            res.json(results);
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
}