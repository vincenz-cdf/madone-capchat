module.exports = function (app, connection) {

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
}