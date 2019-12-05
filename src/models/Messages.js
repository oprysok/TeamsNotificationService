export default (sequelize, DataType) => {
  const Messages = sequelize.define('Messages', {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    project: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    event: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    meta: {
      type: DataType.TEXT,
      get() {
        return JSON.parse(this.getDataValue('meta'));
      },
      set(value) {
        return this.setDataValue('meta', JSON.stringify(value));
      },
    },
  });
  return Messages;
};
