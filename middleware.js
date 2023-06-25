const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        jwt.verify(bearerToken, process.env.SECRET_KEY, function(err, decoded) {
            if (err) {
                return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            }

            req.userId = decoded.id;
            next();
        });
    } else {
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
}
module.exports = verifyToken;