module.exports = {
  up: () => new Promise(resolve => setTimeout(resolve, 10)),

  down: queryInterface => queryInterface.bulkDelete('Notifications', null, {}),
};
