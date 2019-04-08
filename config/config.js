const path = require('path');
const dotenv = require('dotenv');
const rootPath = path.normalize(__dirname + '/../');

dotenv.config();
const env = process.env.NODE_ENV;

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'api'
    },
    port: process.env.PORT_DEV,
    db: process.env.MONGODB_DEV
  },

  test: {
    root: rootPath,
    app: {
      name: 'api'
    },
    port: process.env.PORT_TEST,
    db: process.env.MONGODB_TEST
  },

  production: {
    root: rootPath,
    app: {
      name: 'api'
    },
    port: process.env.PORT || 3000,
    db: process.env.MONGODB_PRODUCTION
  }
};

module.exports = config[env];
