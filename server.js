const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'capchat'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.query("INSERT INTO artists (username, password) VALUES (?, ?)", [username, password], (error) => {
        if (error) {
            console.log(error)
          return res.status(500).send('Erreur inscription');
        }
        res.redirect('/login');
      });
});

app.post('/login', (req, res) => {
    let sql = 'SELECT * FROM artists WHERE username = ? AND password = ?';
    let query = db.query(sql, [req.body.username, req.body.password], (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.status(400).send({ error: 'Invalid username or password' });
        res.send({ token: results[0].id });
    });
});

app.post('/imageset', multer().single('images'), (req, res) => {
    const dir = `images/${req.body.name}`;
    unzipper.Open.buffer(req.file.buffer)
        .then(d => d.extract({ path: dir }))
        .then(() => {
            let imageSet = { ...req.body, artist: req.headers.token };
            let sql = 'INSERT INTO imagesets SET ?';
            let query = db.query(sql, imageSet, (err, result) => {
                if (err) throw err;
                res.send({ message: 'Image set uploaded successfully' });
            });
        });
});

// Serve the login HTML page
app.get('/login', (req, res) => {
    console.log(__dirname)
    res.sendFile(__dirname + '/login.html');
});

// Serve the register HTML page
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});


app.listen(3000, () => console.log('Server started'));
