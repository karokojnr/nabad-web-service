const router = require('express')
  .Router();
const User = require('../models/User');


module.exports = (app) => {
  app.use('/admin/admin', router);
};
