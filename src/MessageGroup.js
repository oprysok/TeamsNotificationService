/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import { transform } from 'json4json';
import fs from 'fs';
import { resolve } from 'path';
import log4js from 'log4js';

const logger = log4js.getLogger('MessageGroup');

export default class MessageGroup {
  constructor(messages, hash, url) {
    this.messages = messages;
    this.project = this.messages[0].project;
    this.url = url;
    this.hash = hash;
    this.generateMessageCard = () => {
      let templatePath = resolve(`./src/message_cards/${this.project}.json`);
      logger.trace(`Template path to be verified ${templatePath}`);
      if (!fs.existsSync(templatePath)) {
        logger.trace('Falling back to default.json template');
        templatePath = './message_cards/default.json';
      }
      const template = require(templatePath);
      const data = { items: this.messages };
      return transform(template, data);
    };
  }
}
