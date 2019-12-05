import request from 'request';
import log4js from 'log4js';

module.exports = (card, url) => {
  const logger = log4js.getLogger('sendMessageCard');
  logger.info(`Posting new notification to: ${url}`);
  logger.trace(JSON.stringify(card));
  request({
    uri: url,
    method: 'POST',
    json: true,
    body: card,
  },
  (/* error, response, body */) => {
    // if (response && response.statusCode == 200) {}
  });
};
