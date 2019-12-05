import HttpStatus from 'http-status';
import Sequelize from 'sequelize';
import log4js from 'log4js';
import Mutex from '../Mutex';

const defaultResponse = (data, statusCode = HttpStatus.OK) => ({
  data,
  statusCode,
});

const errorResponse = (message, statusCode = HttpStatus.BAD_REQUEST) => defaultResponse({
  erro: message,
}, statusCode);

class NotificationController {
  constructor() {
    this.Notifications = global.gDb.models.Notifications;
    this.Notifications.sync();
    this.Mutex = new Mutex();
    this.Logger = log4js.getLogger('NotificationController');
  }

  findOne(params) {
    return this.Notifications.findOne(params);
  }

  getAll() {
    return this.Notifications.findAll({})
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message));
  }

  getById(params) {
    return this.Notifications.findOne({ where: params })
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message));
  }

  create(data) {
    return this.Notifications.create(data)
      .then(this.Logger.trace(data))
      .then(result => defaultResponse(result, HttpStatus.CREATED))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  createOne(obj) {
    return this.Notifications.create(obj);
  }

  update(data, params) {
    return this.Notifications.update(data, {
      where: params,
    })
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  delete(params) {
    return this.Notifications.destroy({
      where: params,
    })
      .then(result => defaultResponse(result, HttpStatus.NO_CONTENT))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  cleanUp() {
    const { Op } = Sequelize;
    return this.Notifications.destroy({
      where: {
        created_at: {
          [Op.lt]: new Date(new Date() - 20 * 60 * 1000),
        },
      },
    });
  }
}

export default NotificationController;
