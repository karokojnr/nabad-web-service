const router = require('express').Router();
const Hotel = require('../models/Hotel');


router.get('/hotels/register', (req, res) => {
    res.json({ message: 'Welcome post some data to /hotels/register' });
});


module.exports = app => {
    app.use('/', router);
}