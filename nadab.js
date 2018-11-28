const config = require('./config/config');
const glob = require('glob');
const mongoose = require('mongoose');
const bluebird = require('bluebird');

// Connection to mongodb
mongoose.connect(config.db, { useMongoClient: true });
mongoose.Promise = bluebird;
const db = mongoose.connection;

db.on('error', () => {
  throw new Error('Unable to connect to database at ' + config.db);
});

// Import models
const models = glob.sync(config.root + './src/models/*.js');
models.forEach(function (model) {
  require(model);
});

// Import the app, and initialize it
const app = require('./config/express')();

app.listen(config.port, () => {
  console.log('Nadab server listening on port ::' + config.port);
});

module.exports = app;