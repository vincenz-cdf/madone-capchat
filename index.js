const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'capchat'
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});

app.get('/', (req, res) => {
    getImagesAndRender(req, res);
});

app.post('/newSet', (req, res) => {
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


function getImagesAndRender(req, res) {
    const sqlFalse = 'SELECT * FROM image WHERE singular = false ORDER BY RAND() LIMIT 7';
    const sqlTrue = 'SELECT * FROM image WHERE singular = true ORDER BY RAND() LIMIT 1';
    connection.query(sqlFalse, function (err, resultsFalse) {
        if (err) throw err;
        connection.query(sqlTrue, function (err, resultsTrue) {
            if (err) throw err;
            let combinedResults = resultsFalse.concat(resultsTrue);
            combinedResults.sort(() => Math.random() - 0.5);
            res.render('capchat/capchat', { hint: resultsTrue[0].hint, images: combinedResults });
        });
    });
}

app.post('/check', (req, res) => {
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

app.get('/login', (req, res) => {
    res.render('auth/login/login');
});

app.post('/signup', (req, res) => {
    const username = req.body.username;
    const password = bcrypt.hashSync(req.body.password, 8);

    connection.query('INSERT INTO user (username, password) VALUES (?, ?)', [username, password], function(error, results, fields) {
        if (error) {
            res.send({ success: false, message: error.sqlMessage });
        } else {
            const token = jwt.sign({ id: results.insertId }, 'myverylongandcomplexsecretkey', {
                expiresIn: 86400 // expires in 24 hours
            });

            res.send({ success: true, message: "User registered successfully!", token: token });
        }
    });
});

app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.use(express.static('views/capchat'));
app.use(express.static('views/auth/login'));

app.listen(3000, () => console.log('Server started'));
