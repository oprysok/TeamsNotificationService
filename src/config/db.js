import Sequelize from 'sequelize';
import fs from 'fs';
import path from 'path';

let database = null;

const loadModels = (sequelize) => {
  const dir = path.join(__dirname, '../models');
  const models = [];
  fs.readdirSync(dir).forEach((file) => {
    const modelDir = path.join(dir, file);
    const model = sequelize.import(modelDir);
    models[model.name] = model;
  });
  return models;
};

export default () => {
  if (!database) {
    const sequelize = new Sequelize(
      global.gConfig.storage.database,
      global.gConfig.storage.username,
      global.gConfig.storage.password,
      global.gConfig.storage.options,
    );
    database = {
      sequelize,
      Sequelize,
      models: {},
    };

    database.models = loadModels(sequelize);
    sequelize.sync().done(() => database);
  }
  return database;
};
