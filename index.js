const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
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
});


app.post('/check', (req, res) => {
    // SQL Query to check whether the image with the given ID is singular
    const sqlCheck = 'SELECT singular FROM image WHERE id = ?';

    connection.query(sqlCheck, [req.body.id], function (err, results) {
        if (err) throw err;

        // If singular is true, send 'Yes', else send 'No'
        if (results[0].singular) {
            res.json('Yes');
        } else {
            res.json('No');
        }
    });
});

app.post('/endOfTime', (req, res) => {
    res.send('retry');
});

app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/resources', express.static(path.join(__dirname, 'resources')));



app.use(express.static('views/capchat'))

app.listen(3000, () => console.log('Server started'));