const twoMessagesGroup = [
  {
    id: 1,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: {
      field1: 'A',
      field2: 'B',
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: {
      field1: 'A',
      field2: 'B',
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const twoByTwoMessageGroup = [
  {
    id: 1,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: { Env: 'DEV' },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: { Env: 'DEV' },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: { Env: 'ACCTEST' },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    key: '1.0.0-alpha.60',
    project: 'Test',
    event: 'deployed',
    meta: { Env: 'ACCTEST' },
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export default {
  twoMessagesGroupNoCustomFields: {
    config: {
      datasources: {
        Test: {
          events: {
            deployed: {
              maxBatchSize: 2,
            },
            url: 'http://example.com/1',
          },
        },
      },
    },
    objects: twoMessagesGroup,
    notificationSent: false,
  },
  twoMessagesGroupOneCustomfieldOneRuleOneCondition: {
    config: {
      datasources: {
        Test: {
          events: {
            deployed: {
              groupBy: ['key'],
              maxBatchSize: 2,
              webhookRules: [
                {
                  conditions: [{ fieldQuery: 'key', fieldPattern: '.' }],
                  url: 'http://example.com/1',
                },
              ],
              url: 'http://example.com/2',
            },
          },
        },
      },
    },
    objects: twoMessagesGroup,
    notificationSent: false,
  },
  multiUrls: {
    config: {
      datasources: {
        Test: {
          events: {
            deployed: {
              groupBy: ['meta.Env'],
              maxBatchSize: 2,
              webhookRules: [
                {
                  conditions: [{ fieldQuery: 'meta.Env', fieldPattern: 'DEV' }],
                  url: 'http://example.com/1',
                },
                {
                  conditions: [{ fieldQuery: 'meta.Env', fieldPattern: 'ACCTEST' }],
                  url: 'http://example.com/2',
                },
              ],
            },
          },
        },
      },
    },
    objects: twoByTwoMessageGroup,
    notificationSent: false,
  },

};
