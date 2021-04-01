let PACKAGE_DATA = {
  author: 'Alex Bazhin',
  main: 'index.js',
  scripts: {
    start: 'node index.js',
    dev: 'npx nodemon',
    test: 'echo "Error: no test specified" && exit 1',
    doc: 'apidoc -i src/ -o apidoc/'
  },
  license: 'ISC',
  apidoc: {
    title: 'REST API documentation',
    url: 'http://localhost:3000/api'
  },
  dependencies: {
    'body-parser': '^1.18.2',
    'cors': '^2.8.5',
    'express': '^4.16.2',
    'express-jwt': '^6.0.0',
    'express-session': '^1.17.1',
    'jsonwebtoken': '^8.5.1',
    'moment': '^2.29.1',
    'mongoose': '^5.3.9',
    'passport': '^0.4.1',
    'passport-local': '^1.0.0'
  }
};

let GITIGNORE_CODE = `.idea/
node_modules/
log.txt`;

let INDEX_CODE = `const express = require('express');
const app = express();
const config = require('./src/config/config.json');

const startMessage = config.startMessage;
const port = process.env.PORT || config.port;

async function startServer() {
    await require('./src/loaders').loaders({expressApp: app});
    app.listen(port, () => console.log(\`\\n###############################\\n# \${startMessage}: \${port} #\\n###############################\\n\`));
}

startServer();`;

let CONFIG_DATA = {
  startMessage: 'App listening on port'
};

let EXPRESS_LOADER_CODE = `const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

module.exports.expressLoader = async function(app) {
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
  });
  app.use(express.static(__dirname + '\\\\static'));
  app.use(session({
    secret: 'secret',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  }));

  //Health check endpoints
  app.get('/status', (req, res) => {
    res.status(200).send('Server is running').end();
  });
  app.head('/status', (req, res) => {
    res.status(200).send('Server is running').end();
  });

  app.enable('trust proxy');

  //Catch 404 and forward to error handler
  app.use((req, res, next) => {
    const error = new Error('Not Found');
    error['status'] = 404;
    next(error);
  });

  //error handlers
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message
      }
    });
  });
};`;

let MSSQL_LOADER_CODE = '';

let MONGODB_LOADER_CODE = `const mongoose = require('mongoose');
const config = require('../config/config.json');

module.exports.mongooseLoader = async function() {
  mongoose.connect(\`\${config.dataBase.host}\`, { useNewUrlParser: true });
  mongoose.set('debug', true);
};`;

let SOCKET_IO_LOADER_CODE = `const config = require('../config/config');

module.exports.socketIOLoader = async function () {
  const socket = require('socket.io-client')(config.gatewayUrl);
  require('../components').connection(socket);
};`;

let INDEX_LOADER_CODE = `module.exports.loaders = async function({ expressApp }) {
  await require('./express').expressLoader(expressApp);
  await require('./mongodb').mongooseLoader();
  await require('./socket-io').socketIOLoader();
};`;

const LOGGER_CODE = `const log = require('cllc')();
const fs = require('fs');

function addLogToFile (str) {
  fs.appendFile('log.txt', \`\${str}\\n\`, error => {
    if (error) return log.error(error);
  });
}

module.exports.debug = str => {
  log.debug(str);
  addLogToFile(str);
};

module.exports.info = str => {
  log.info(str);
  addLogToFile(str);
};

module.exports.warn = str => {
  log.warn(str);
  addLogToFile(str);
};

module.exports.error = str => {
  log.error(str);
  addLogToFile(str);
};`;

module.exports = {
  PACKAGE_DATA: PACKAGE_DATA,
  GITIGNORE_CODE: GITIGNORE_CODE,
  INDEX_CODE: INDEX_CODE,
  CONFIG_DATA: CONFIG_DATA,
  EXPRESS_LOADER_CODE: EXPRESS_LOADER_CODE,
  MSSQL_LOADER_CODE: MSSQL_LOADER_CODE,
  MONGODB_LOADER_CODE: MONGODB_LOADER_CODE,
  SOCKET_IO_LOADER_CODE: SOCKET_IO_LOADER_CODE,
  INDEX_LOADER_CODE: INDEX_LOADER_CODE,
  LOGGER_CODE: LOGGER_CODE,
};
