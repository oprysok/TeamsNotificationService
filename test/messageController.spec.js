/* eslint-disable no-param-reassign */
import { assert } from 'chai';
import { setup, loadProfile } from './support/messageTestHelper';

describe('MessageController', () => {
  describe('#process', function cb() {
    before(() => {
      setup(this);
    });

    it('groups complete set of messages by default fields.', (done) => {
      loadProfile('twoMessagesGroupNoCustomFields', this);
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 1);
          assert.sameOrderedMembers(
            this.profile.objects.map(x => x.id),
            this.messageGroups[0].messages.map(x => x.id),
          );
          assert.equal(this.profile.config.datasources.Test.events.deployed.url,
            this.messageGroups[0].url);
          done();
        });
    });

    it('groups complete set of messages by project, event, key and primary field as custom.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this);
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 1);
          assert.sameOrderedMembers(
            this.profile.objects.map(x => x.id),
            this.messageGroups[0].messages.map(x => x.id),
          );
          assert.equal(this.profile.config.datasources.Test.events.deployed.webhookRules[0].url,
            this.messageGroups[0].url);
          done();
        });
    });

    it('groups complete set by custom filed but different field in webhookRules.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.config.datasources.Test.events.deployed.webhookRules[0].conditions[0].fieldQuery = 'project';
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('groups complete set by custom fields and multi conditions - positive.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.config.datasources.Test.events.deployed.groupBy = ['meta.field1', 'meta.field2'];
        p.config.datasources.Test.events.deployed.webhookRules[0].conditions = [
          { fieldQuery: 'meta.field1', fieldPattern: 'A' },
          { fieldQuery: 'meta.field2', fieldPattern: 'B' },
        ];
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 1);
          assert.sameOrderedMembers(
            this.profile.objects.map(x => x.id),
            this.messageGroups[0].messages.map(x => x.id),
          );
          assert.equal(this.profile.config.datasources.Test.events.deployed.webhookRules[0].url,
            this.messageGroups[0].url);
          done();
        });
    });

    it('groups complete set by custom fields and multi conditions - negative.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.config.datasources.Test.events.deployed.groupBy = ['meta.field1', 'meta.field2'];
        p.config.datasources.Test.events.deployed.webhookRules[0].conditions = [
          { fieldQuery: 'meta.field1', fieldPattern: 'A' },
          { fieldQuery: 'meta.field2', fieldPattern: 'C' },
        ];
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('ignores non-timedout uncomplete set of messages having same project, event, key.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.objects.length = 1;
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('groups timedout incomplete set of messages having same project, event, key.', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.objects.length = 1;
        const dt = new Date();
        dt.setMinutes(dt.getMinutes() - p.config.datasources.Test.events.deployed.timeOutMinutes);
        p.objects[0].created_at = dt;
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 1);
          done();
        });
    });

    it('ignores when messages mismatch by project', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.objects[1].project = 'Test2';
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('ignores when messages mismatch by event', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.objects[1].event = 'someevent';
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('ignores when messages mismatch by key', (done) => {
      loadProfile('twoMessagesGroupOneCustomfieldOneRuleOneCondition', this, (p) => {
        p.objects[1].key = '0.0.1';
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 0);
          done();
        });
    });

    it('groups by webhooks', (done) => {
      loadProfile('multiUrls', this);
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 2);
          assert.equal(this.profile.config.datasources.Test.events.deployed.webhookRules[0].url,
            this.messageGroups[0].url);
          assert.equal(this.profile.config.datasources.Test.events.deployed.webhookRules[1].url,
            this.messageGroups[1].url);
          done();
        });
    });

    it('ignores if webhooks mismatch', (done) => {
      loadProfile('multiUrls', this, (p) => {
        p.config.datasources.Test.events.deployed.webhookRules[0].conditions[0].fieldPattern = 'PROD';
      });
      this.messageController.process()
        .then(() => {
          assert.lengthOf(this.messageGroups, 1);
          assert.equal(this.profile.config.datasources.Test.events.deployed.webhookRules[1].url,
            this.messageGroups[0].url);
          done();
        });
    });
  });
});
