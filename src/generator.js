const fs = require('fs');
const _ = require('lodash');

let PACKAGE_DATA = require('./constants').PACKAGE_DATA;
let GITIGNORE_CODE = require('./constants').GITIGNORE_CODE;
let INDEX_CODE = require('./constants').INDEX_CODE;
let CONFIG_DATA = require('./constants').CONFIG_DATA;
let EXPRESS_LOADER_CODE = require('./constants').EXPRESS_LOADER_CODE;
let MSSQL_LOADER_CODE = require('./constants').MSSQL_LOADER_CODE;
let MONGODB_LOADER_CODE = require('./constants').MONGODB_LOADER_CODE;
let SOCKET_IO_LOADER_CODE = require('./constants').SOCKET_IO_LOADER_CODE;
let INDEX_LOADER_CODE = require('./constants').INDEX_LOADER_CODE;
let LOGGER_CODE = require('./constants').LOGGER_CODE;

class BackendGenerator {
  constructor(settings) {
    this.SETTINGS = settings;

    this.DIR_PROJECT = '';
    this.DIR_CONFIG = '';
    this.DIR_LOADERS = '';
    this.DIR_COMPONENTS = '';
    this.DIR_SCRIPTS = '';
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* common */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Генерация проекта */
  generate () {
    this.generateDirectoryStructure();

    /* package.json */
    this.setPackageData(this.SETTINGS);
    this.generateFile(`../${this.DIR_PROJECT}/`, 'package.json', PACKAGE_DATA);
    this.generateFile(`../${this.DIR_PROJECT}/`, '.gitignore', GITIGNORE_CODE);

    /* index.js */
    this.generateFile(`../${this.DIR_PROJECT}/`, 'index.js', INDEX_CODE);

    /* config */
    this.setConfigData(this.SETTINGS);
    this.generateFile(this.DIR_CONFIG, 'config.json', CONFIG_DATA);

    /* loaders */
    this.generateFile(this.DIR_LOADERS, 'express.js', EXPRESS_LOADER_CODE);
    this.generateDataBaseLoader(this.DIR_LOADERS, this.SETTINGS);
    this.generateFile(this.DIR_LOADERS, 'socket-io.js', SOCKET_IO_LOADER_CODE);
    this.generateFile(this.DIR_LOADERS, 'index.js', INDEX_LOADER_CODE);

    /* components */
    this.generateComponents(this.SETTINGS);

    /* scripts */
    this.generateFile(this.DIR_SCRIPTS, 'logger.js', LOGGER_CODE);

    console.log('Microservice created successfully!');
  }

  /* Генерация компонента */
  generateComponent (component) {
    this.setProjectDirectory(this.SETTINGS.name);
    this.setComponentsDirectory();

    fs.stat(this.DIR_COMPONENTS, error => {
      if (error) {
        console.error(`There is no project '${this.DIR_COMPONENTS}'. Create a project.`);
        return;
      }

      this.generateDir(`${this.DIR_COMPONENTS}/${component.name}`);
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, 'index.js', this.setIndexComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.config.json`, this.setConfigComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.model.js`, this.setModelComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.middleware.js`, this.setMiddlewareComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.service.js`, `// ${component.name}.service.js`);
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.spec.js`, `// ${component.name}.spec.js`);

      console.log('Component created successfully!');
    });
  }

  /* Генерация структуры директорий */
  generateDirectoryStructure () {
    /* project */
    this.setProjectDirectory(this.SETTINGS.name);
    this.generateDir('../' + this.DIR_PROJECT);
    this.generateDir(`../${this.DIR_PROJECT}/src`);

    /* config */
    this.setConfigDirectory();
    this.generateDir(this.DIR_CONFIG);

    /* loaders */
    this.setLoadersDirectory();
    this.generateDir(this.DIR_LOADERS);

    /* components */
    this.setComponentsDirectory();
    this.generateDir(this.DIR_COMPONENTS);

    /* scripts */
    this.setScriptsDirectory();
    this.generateDir(this.DIR_SCRIPTS);
  }

  /* Генерация директории */
  generateDir (dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }

  /* Генерация файла */
  generateFile (dir, file, data) {
    data = typeof data === 'string' ? data : JSON.stringify(data);

    fs.writeFile(dir + '/' + file, data, error => {
      if (error) throw error;
    });
  }

  /* Установка заглавной буквы */
  setFirstLetterToUpperCase (str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* NEW PROJECT */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка названия директории проекта */
  setProjectDirectory (name) {
    this.DIR_PROJECT = name;
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* PACKAGE.JSON */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка данных package.json */
  setPackageData (settings) {
    PACKAGE_DATA = Object.assign({
      name: settings.name,
      version: settings.version,
      description: settings.description,
      author: settings.author,
    }, PACKAGE_DATA);
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* CONFIG */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка директории config */
  setConfigDirectory () {
    this.DIR_CONFIG = `../${this.DIR_PROJECT}/src/config`;
  }

  /* Установка данных config.json */
  setConfigData (settings) {
    CONFIG_DATA = Object.assign(CONFIG_DATA, {
      port: settings.port,
      gatewayUrl: settings.gatewayUrl,
      dataBase: settings.dataBase
    });
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* LOADERS */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка директории loaders */
  setLoadersDirectory () {
    this.DIR_LOADERS = `../${this.DIR_PROJECT}/src/loaders`;
  }

  /* Генерация loader базы данных */
  generateDataBaseLoader (dir, settings) {
    switch (settings.dataBase.engine) {
      //todo сделать для других БД
      case 'mssql': this.generateFile(dir, 'sql.js', MSSQL_LOADER_CODE);
      case 'mongodb': this.generateFile(dir, 'mongodb.js', MONGODB_LOADER_CODE);
    }
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* COMPONENTS */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка директории components */
  setComponentsDirectory () {
    this.DIR_COMPONENTS = `../${this.DIR_PROJECT}/src/components`;
  }

  /* Установка кода index.js всех компонентов */
  setIndexComponentsCode (components) {
    let importComponentsCode = '';
    let routerUseCode = '';

    components.forEach(component => {
      importComponentsCode += `const ${component.name} = require('./${component.name}');\n`;
      routerUseCode += `${component.name}.connection(socket);\n`;
    });

    return `const fs = require('fs');
${importComponentsCode}
function updateAPI (socket) {
  socket.on('updateAPI', data => {
    console.log('updateAPI - ${this.SETTINGS.code_name}');
    const names = fs.readdirSync('./src/components').filter(name => name !== 'index.js');
    const components = [];

    for (let i = 0; i < names.length; i++) {
      components.push(require('./' + names[i] + '/' + names[i] + '.config.json'));
    }

    socket.emit('updateAPI', {
      status: 200,
      statusMessage: \`Update microservices API\`,
      data: {
        name: '${this.SETTINGS.code_name}',
        components
      }
    });
  });
}

module.exports.connection = function (socket) {
  ${routerUseCode}
  updateAPI(socket);
};`;
  }

  /* Установка кода index.js */
  setIndexComponentCode (component) {
    return `const methods = require('./${component.name}.config').methods;
const middlewares = require('./${component.name}.middleware');

function connect(socket, methods) {
  for (let i = 0; i < methods.length; i++) {
    socket.on(methods[i], data => middlewares[methods[i]](socket, data));
  }
}

module.exports.connection = function (socket) {
  connect(socket, methods);
};`;
  }

  /* Установка кода model */
  setModelComponentCode (component) {
    const initCode = `const mongoose = require('mongoose');
const Schema = mongoose.Schema;`;

    const schemaCode = `const ${component.name}Schema = new Schema(
    ${JSON.stringify(component.fields)}
);`;
    const modelExportsCode = `module.exports = {
    model: mongoose.model('${this.setFirstLetterToUpperCase(component.name)}', ${component.name}Schema),
    schema: ${component.name}Schema
};`;

    return initCode + '\n\n' + schemaCode + '\n\n' + modelExportsCode;
  }

  /* Установка кода API */
  setConfigComponentCode (component) {
    return `{
  "name": "${component.name}",
  "methods": [
    "get${this.setFirstLetterToUpperCase(component.name)}s",
    "add${this.setFirstLetterToUpperCase(component.name)}",
    "edit${this.setFirstLetterToUpperCase(component.name)}",
    "delete${this.setFirstLetterToUpperCase(component.name)}"
  ]
}`;
  }

  /* Установка кода Middleware */
  setMiddlewareComponentCode (component) {
    const name = component.name;
    const fields = {};

    for (let key in component.fields) {
      fields[key] = `req.body.${key}`;
    }

    return `const ${this.setFirstLetterToUpperCase(name)}Model = require('./${name}.model').model;
const moment = require('moment');
const log = require('../../scripts/logger');

module.exports.get${this.setFirstLetterToUpperCase(name)}s = (socket, data) => {
  ${this.setFirstLetterToUpperCase(name)}Model.find({}, (error, ${name}s) => {
    if (error) console.error(error);

    log.info(\`\${moment().format('DD.MM.YYYY HH:mm:ss')} - Got ${name}s\`);

    socket.emit('get${this.setFirstLetterToUpperCase(name)}s', {
      status: 200,
      statusMessage: \`Got ${name}s\`,
      data: ${name}s
    });
  });
};

module.exports.get${this.setFirstLetterToUpperCase(name)}ById = (socket, data) => {
  ${this.setFirstLetterToUpperCase(name)}Model.findOne({ _id: data._id }, (error, ${name}) => {
    if (error) console.error(error);

    log.info(\`\${moment().format('DD.MM.YYYY HH:mm:ss')} - Got ${name} by \${data._id}\`);

    socket.emit('get${this.setFirstLetterToUpperCase(name)}ById', {
      status: 200,
      statusMessage: \`Got ${name} by \${data._id}\`,
      data: ${name}
    });
  });
};

module.exports.add${this.setFirstLetterToUpperCase(name)} = (socket, data) => {
  data = JSON.parse(data);
  
  const ${name} = new ${this.setFirstLetterToUpperCase(name)}Model(data);

  ${name}.save(error => {
    if (error) console.error(error);

    log.info(\`\${moment().format('DD.MM.YYYY HH:mm:ss')} - Added ${name}\`);

    socket.emit('add${this.setFirstLetterToUpperCase(name)}', {
      status: 200,
      statusMessage: \`Added ${name}\`,
      message: 'success'
    });
  });
};

module.exports.edit${this.setFirstLetterToUpperCase(name)} = (socket, data) => {
  ${this.setFirstLetterToUpperCase(name)}Model.findOneAndUpdate({ _id: data._id }, data, (error, updated${this.setFirstLetterToUpperCase(name)}) => {
    if (error) console.error(error);

    log.info(\`\${moment().format('DD.MM.YYYY HH:mm:ss')} - Updated ${name} \${data._id}\`);

    socket.emit('edit${this.setFirstLetterToUpperCase(name)}', {
      status: 200,
      statusMessage: \`Updated ${name} \${data._id}\`,
      data: updated${this.setFirstLetterToUpperCase(name)}
    });
  });
};

module.exports.delete${this.setFirstLetterToUpperCase(name)} = (socket, data) => {
  ${this.setFirstLetterToUpperCase(name)}Model.deleteOne({ _id: data._id }).exec(error => {
    if (error) console.error(error);

    log.info(\`\${moment().format('DD.MM.YYYY HH:mm:ss')} - Deleted ${name} \${data._id}\`);

    socket.emit('delete${this.setFirstLetterToUpperCase(name)}', {
      status: 200,
      statusMessage: \`Deleted ${name} \${data._id}\`,
      data: 'success'
    });
  });
};`;
  }

  /* Генерация компонентов */
  generateComponents (settings) {
    this.generateFile(`${this.DIR_COMPONENTS}`, 'index.js', this.setIndexComponentsCode(settings.components));

    settings.components.forEach(component => {
      this.generateDir(`${this.DIR_COMPONENTS}/${component.name}`);
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, 'index.js', this.setIndexComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.config.json`, this.setConfigComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.model.js`, this.setModelComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.middleware.js`, this.setMiddlewareComponentCode(component));
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.service.js`, `// ${component.name}.service.js`);
      this.generateFile(`${this.DIR_COMPONENTS}/${component.name}`, `${component.name}.spec.js`, `// ${component.name}.spec.js`);
    });
  }

  /* ------------------------------------------------------------------------------------------------------------------ */
  /* SCRIPTS */
  /* ------------------------------------------------------------------------------------------------------------------ */

  /* Установка директории scripts */
  setScriptsDirectory () {
    this.DIR_SCRIPTS = `../${this.DIR_PROJECT}/src/scripts`;
  }
}

module.exports = BackendGenerator;
