module.exports = function(app, connection) {
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
}
