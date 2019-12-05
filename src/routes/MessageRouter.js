import MessageController from '../controllers/MessageController';

export default (app) => {
  const messageController = new MessageController();

  app.route('/')
    // .all(app.auth.authenticate())
    .get((req, res) => {
      // res.status(response.statusCode);
      messageController.enqueueForProcessing();
      res.json();
    });

  app.route('/messages')
    // .all(app.auth.authenticate())
    .get((req, res) => {
      messageController.getAll()
        .then((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    })
    .post((req, res) => {
      messageController.create(req.body)
        .then((response) => {
          messageController.enqueueForProcessing();
          res.status(response.statusCode);
          res.json(response.data);
        });
    });

  app.route('/messages/:id')
    // .all(app.auth.authenticate())
    .get((req, res) => {
      messageController.getById(req.params)
        .then((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    })
    .put((req, res) => {
      messageController.update(req.body, req.params)
        .then((response) => {
          res.status(response.statusCode);
          res.json(response.data);
        });
    })
    .delete((req, res) => {
      messageController.delete(req.params)
        .then((response) => {
          res.sendStatus(response.statusCode);
        });
    });
};
