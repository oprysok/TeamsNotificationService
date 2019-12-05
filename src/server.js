import express from 'express';
import bodyParser from 'body-parser';
import log4js from 'log4js';
import db from './config/db';
import messagesRouter from './routes/MessageRouter';
import MessageController from './controllers/MessageController';
import NotificationController from './controllers/NotificationController';
import sendMessageCard from './sendMessageCard';
import config from './config/config';

const app = express();
// process.env.NODE_ENV = 'staging';
global.gConfig = config;
global.gDb = db();
app.use(bodyParser.json());
messagesRouter(app);
const logger = log4js.getLogger('server.js');

app.listen(global.gConfig.node_port, () => {
  logger.info(`HTTP listening started at port ${global.gConfig.node_port}`);
});

function main() {
  const notificationController = new NotificationController();
  const messageController = new MessageController(sendMessageCard, notificationController);
  messageController.enqueueForProcessing(global.gConfig.datasources);
  notificationController.cleanUp();
}

main();
setInterval(() => { main(); }, global.gConfig.interval);
