/* eslint-disable global-require */
/* eslint-disable no-param-reassign */
import sinon from 'sinon';
import rewiremock from 'rewiremock';
import MessageCardMock from './MockMessageSender';
import NotificationControllerMock from './NotificationControllerMock';
import testProfiles from './messageTestProfiles';

const SequelizeMock = require('sequelize-mock');

export function setup(self) {
  const dbMock = new SequelizeMock();
  dbMock.define('Messages');
  global.gDb = dbMock;
  self.messageGroups = [];
  self.messageCardSender = new MessageCardMock();
  rewiremock(() => require('../../src/sendMessageCard')).with(self.messageCardSender.sendMessageCard);
  rewiremock(() => require('../../src/controllers/NotificationController')).with(NotificationControllerMock);
  rewiremock(() => require('log4js')).with({
    getLogger: () => ({
      info: () => {},
      trace: () => {},
      warn: () => {},
    }),
  });
  rewiremock.enable();
  const MessageController = require('../../src/controllers/MessageController').default;
  self.messageController = new MessageController();
  sinon.stub(MessageController.prototype, 'processMessageGroupAsync').callsFake((x) => {
    self.messageGroups.push(x);
  });
  rewiremock.disable();
}

export function loadProfile(profileName, self, transformProfile) {
  self.messageGroups = [];
  self.profile = JSON.parse(JSON.stringify(testProfiles[profileName]));
  if (transformProfile !== undefined) { transformProfile(self.profile); }
  global.gConfig = self.profile.config;
  const queueResult = [];
  self.profile.objects.forEach((element) => {
    queueResult.push(global.gDb.models.Messages.build(element));
  });
  global.gDb.models.Messages.$queueResult(queueResult);

/*
    global.gDb.models.Messages.$queryInterface.$useHandler(function(query, queryOptions, done) {
        if (query === "destroy") {
            console.log("deleting");
            console.log(queryOptions);
            return Promise.resolve(true);
        } else {
            return;
        }
    });
    */
}
