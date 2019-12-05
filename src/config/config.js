import log4js from 'log4js';

const Sequelize = require('sequelize');
const merge = require('deepmerge');
const config = require('./config.json');

const loadConfig = () => {
  const defaultConfig = config.development;
  const environment = process.env.NODE_ENV || 'development';
  const environmentConfig = config[environment];
  const overwriteMerge = sourceArray => sourceArray;
  const finalConfig = merge(defaultConfig, environmentConfig, { arrayMerge: overwriteMerge });
  finalConfig.storage.options.operatorsAliases = Sequelize.Op;
  return finalConfig;
};

let exportObj = null;

if (process.mainModule.filename.includes('sequelize-cli')) {
  const cfg = loadConfig();
  exportObj = Object.assign(
    {},
    {
      database: cfg.storage.database,
      username: cfg.storage.username,
      password: cfg.storage.password,
    },
    cfg.storage.options,
  );
} else {
  exportObj = loadConfig();
}

log4js.configure(exportObj.log4js);
const logger = log4js.getLogger('config.js');
logger.info(`Using configuration for "${exportObj.config_id}" environment.`);

module.exports = exportObj;
