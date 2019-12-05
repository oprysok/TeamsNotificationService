const log = require('fancy-log');

class NotificationControllerMock {
  constructor(findResult) {
    this.FindResult = findResult;
    this.Notifications = [];
  }

  findOne() {
    log('NotificationControllerMock.findOne called');
    return new Promise((resolve) => {
      resolve(this.FindResult);
    });
  }

  createOne(obj) {
    log('NotificationControllerMock.createOne called');
    this.Notifications.push(obj);
  }
}

export default NotificationControllerMock;
