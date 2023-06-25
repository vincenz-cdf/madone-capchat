const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware');

module.exports = function (app, connection) {
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;

        const sqlCheck = 'SELECT * FROM user WHERE email = ?';
        connection.query(sqlCheck, [username], async function (err, results) {
            if (err) throw err;

            if (results.length > 0) {
                const comparison = await bcrypt.compare(password, results[0].password)
                if (comparison) {
                    const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: 3600 });
                    res.status(200).send({ auth: true, success: true, redirect: '/', token });
                } else {
                    res.send({ auth: false, message: 'Identifiant ou mdp invalide', success: false });
                }
            } else {
                res.send({ auth: false, message: 'Identifiant ou mdp invalide', success: false });
            }
        });
    });



    app.post('/register', (req, res) => {
        const username = req.body.username;
        const email = req.body.email;
        const password = bcrypt.hashSync(req.body.password, 8);

        const sqlCheck = 'SELECT * FROM user WHERE email = ?';
        connection.query(sqlCheck, [email], function (err, results) {
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


    app.get('/currentUser', verifyToken, (req, res) => {
        const userId = req.userId;
        const sqlCheck = 'SELECT id, username, email FROM user WHERE id = ?';
        connection.query(sqlCheck, [userId], function (err, results) {
            if (err) throw err;
            res.json(results[0]);
        });
    });
}
