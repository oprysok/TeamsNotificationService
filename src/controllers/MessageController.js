import HttpStatus from 'http-status';
import Sequelize from 'sequelize';
import log4js from 'log4js';
import jsonQuery from 'json-query';
import sha1 from 'sha1';
import _ from 'lodash';
import Mutex from '../Mutex';
import MessageGroup from '../MessageGroup';
import SendNotification from '../sendMessageCard';
import NotificationController from './NotificationController';

const defaultResponse = (data, statusCode = HttpStatus.OK) => ({
  data,
  statusCode,
});

const errorResponse = (message, statusCode = HttpStatus.BAD_REQUEST) => defaultResponse({
  erro: message,
}, statusCode);

class MessageController {
  constructor() {
    // this.NotificationController = notificationController;
    this.NotificationController = new NotificationController();
    this.SendNotification = SendNotification;
    this.Messages = global.gDb.models.Messages;
    this.Mutex = new Mutex();
    this.Logger = log4js.getLogger('MessageController');
  }

  getAll() {
    return this.Messages.findAll({})
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message));
  }

  getById(params) {
    return this.Messages.findOne({ where: params })
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message));
  }

  create(data) {
    return this.Messages.create(data)
      .then(this.Logger.trace(data))
      .then(result => defaultResponse(result, HttpStatus.CREATED))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  update(data, params) {
    return this.Messages.update(data, {
      where: params,
    })
      .then(result => defaultResponse(result))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  delete(params) {
    return this.Messages.destroy({
      where: params,
    })
      .then(result => defaultResponse(result, HttpStatus.NO_CONTENT))
      .catch(error => errorResponse(error.message, HttpStatus.UNPROCESSABLE_ENTITY));
  }

  processMessageGroupAsync(mg, self) {
    const { Op } = Sequelize;
    self.Logger.info(`Combining ${mg.messages.length} message(s)...`);
    const mc = mg.generateMessageCard();
    const notifcationHash = mg.hash;
    return self.NotificationController.findOne({ where: { sha: notifcationHash } })
      .then((result) => {
        if (result) {
          self.Logger.warn('Same message card was already sent...');
        } else {
          self.SendNotification(mc, mg.url);
          self.NotificationController.createOne({ sha: notifcationHash });
        }
      })
      .then(() => {
        const ids = mg.messages.map(x => x.id);
        return this.Messages.destroy({ where: { id: { [Op.in]: ids } }, force: true });
      });
  }

  process() {
    const groupByFields = ['key', 'project', 'event'];
    return this.getAll().then((response) => {
      const groupedByBasicProps = _
        .chain(response.data.filter((i) => {
          const isValidMessage = (global.gConfig.datasources[i.project] !== undefined
            && global.gConfig.datasources[i.project].events[i.event] !== undefined);
          return isValidMessage;
        }))
        .groupBy(item => groupByFields.map(x => item[x]).join('--'))
        .map(v => v)
        .value();
      const msgGrp = [];
      groupedByBasicProps.forEach((basicMessageSet) => {
        const projectSettings = global.gConfig.datasources[basicMessageSet[0].project];
        const eventSettings = projectSettings.events[basicMessageSet[0].event];
        const messageSets = {};
        basicMessageSet.forEach((m) => {
          let queryResult;
          if (eventSettings.groupBy !== undefined) {
            queryResult = eventSettings.groupBy.map(f => (jsonQuery(f, { data: m })).value).join('--');
          }
          const uniqueId = `${m.project}--${m.key}--${m.event}--${queryResult}`;
          const hash = sha1(uniqueId);
          if (messageSets[hash] === undefined) {
            messageSets[hash] = {
              messages: [],
              queryResult: null,
            };
          }
          messageSets[hash].messages.push(m);
          messageSets[hash].queryResult = queryResult;
        });

        // check that message set is ready
        // and select destination url
        Object.keys(messageSets).forEach((hash) => {
          const messageSet = messageSets[hash];
          if (this.isMessageSetReady(messageSet.messages)) {
            if (eventSettings.webhookRules === undefined) {
              msgGrp.push(new MessageGroup(messageSet.messages, hash, eventSettings.url));
            } else {
              eventSettings.webhookRules.forEach((wRule) => {
                const results = wRule.conditions.map((c) => {
                  if (eventSettings.groupBy === undefined
                    || !eventSettings.groupBy.includes(c.fieldQuery)) {
                    this.Logger.warn(`webhookRules cannot be based on field '${c.fieldQuery}' since it was not used for message groupping (groupBy section)`);
                    return null;
                  }
                  const queryResult = jsonQuery(c.fieldQuery, { data: messageSet.messages[0] });
                  const match = queryResult.value.match(c.fieldPattern);
                  if (match === null) {
                    this.Logger.warn(`webhookRules condition was not met. Query: '${c.fieldQuery}', query result: '${queryResult.value}', pattern: '${c.fieldPattern}'.`);
                  }
                  return queryResult.value.match(c.fieldPattern);
                });
                const conditionsMet = !results.some(r => r === null);
                if (conditionsMet) {
                  msgGrp.push(new MessageGroup(messageSet.messages, hash, wRule.url));
                }
              });
            }
          }
        });
      });
      const actions = msgGrp.map(x => this.processMessageGroupAsync(x, this));
      return Promise.all(actions);
    });
  }

  isMessageSetReady(messages) {
    const config = global.gConfig.datasources[messages[0].project];
    const { event } = messages[0];
    const maxBatchSize = config.events[event].maxBatchSize || 1;
    const isComplete = messages.length >= maxBatchSize;
    const isNotTimedOut = messages.some((element) => {
      const diffDouble = (new Date() - new Date(Date.parse(element.created_at))) / (1000 * 60);
      const diffMinutes = Math.floor(diffDouble);
      const timeOutMinutes = config.events[event].timeOutMinutes || 5;
      this.Logger.trace(`${diffMinutes} < ${timeOutMinutes}`);
      return diffMinutes < timeOutMinutes; // minutes
    });
    const isTimedOut = !isNotTimedOut;

    if (isComplete || isTimedOut) {
      if (!isComplete && isTimedOut) {
        this.Logger.warn('Timed out waiting for a complete message set.');
      }
    } else {
      this.Logger.warn(`Won't process messages. Set is not complete [${messages.length}/${maxBatchSize}]`);
      return false;
    }
    return true;
  }

  async enqueueForProcessing(datasources) {
    const unlock = await this.Mutex.lock();
    this.process(datasources);
    unlock();
  }
}

export default MessageController;
