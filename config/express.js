const express = require('express');
const glob = require('glob');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('./config');
const app= express();

module.exports = () => {
  const env = process.env.NODE_ENV;
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env === 'development';

  if (env === 'development') app.use(logger('dev'));

  // CORS headers
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Add necessary middlewares
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(session({
    name: 'nadab',
    secret: process.env.SESSIONKEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: new Date(Date.now() + 3600000),
      maxAge: 3600000
    }
  }));
  app.use(express.static(config.root + 'public'));

  // Import all controllers and call app on them
  let controllers = glob.sync(config.root + '/src/routes/*.js');
  controllers.forEach((controller) => {
    require(controller)(app);
  });

  return app;
};
