const fs = require('fs');
const BackendGenerator = require('./src/generator');

/* Get data from settings.json */
const BACKEND_SETTINGS = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
const backendGenerator = new BackendGenerator(BACKEND_SETTINGS);

if (process.env.npm_config_component) {
  const componentData = BACKEND_SETTINGS.components.filter(component => component.name === process.env.npm_config_component);

  if (componentData.length > 0) {
    backendGenerator.generateComponent(componentData[0]);
  } else {
    console.error(`There is no configuration for component '${process.env.npm_config_component}'. Describe the configuration in a settings.json.`);
  }
} else {
  backendGenerator.generate();
}
