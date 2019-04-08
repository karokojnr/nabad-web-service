const router = require('express').Router();
const config = require('../../config/config');
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(config.root, '/public/api.html'));
});

module.exports = app => {
    app.use('/', router);
}