module.exports = {
  up: queryInterface => queryInterface.bulkInsert('Messages', [
    {
      key: '1.0.0-alpha.60',
      project: 'MySites',
      event: 'deployed',
      meta: JSON.stringify({
        Environment: 'DEV',
        Tenant: 'asd',
        ReleaseUrl: 'http://release.com/',
        Channel: 'Unstable',
        URL: ['http://example.com/', 'http://example2.com/'],
        Status: 'Succeeded',
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      key: '0.1.0-alpha.80',
      project: 'DIDUI',
      event: 'deployed',
      meta: JSON.stringify({
        Environment: 'DEV',
        ReleaseUrl: 'http://release.com/',
        Channel: 'Unstable',
        URL: ['http://example.com/', 'http://example2.com/'],
        Status: 'Succeeded',
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('Messages', null, {}),
};
