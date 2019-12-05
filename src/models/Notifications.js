export default (sequelize, DataType) => {
  const Notifications = sequelize.define('Notifications', {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sha: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });
  return Notifications;
};
