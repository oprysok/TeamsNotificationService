export default class MockMessageSender {
  constructor() {
    this.Requests = [];
    this.sendMessageCard = (card, url) => {
      this.Requests.push({
        url,
        card,
      });
    };
  }
}
