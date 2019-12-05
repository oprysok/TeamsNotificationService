# Intro
`TeamsNotificationService` is a service that helps to route notifications to a specific __Microsoft Teams__ connector webhook depending on input data. It can also combine multiple messages having identical primary fields and optionaly custom data field.

## Terminology
|Name|Description|
|-|-|
|message|Data from an incoming request to the service|
|message group / batch|Set of messages that will be used to make one notification|
|notification|Data formed by the service and used in the body of an outgoing request to a  __Microsoft Teams__ connector webhook|
|message card|Specific JSON format of [actionable messages](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference) designed by Microsoft|

# Messages
## Request example

```javascript
POST /messages/ HTTP/1.1
Content-Type: application/json

{
  "key": "1.0.0-alpha.60",
  "project": "myproject",
  "event": "deployed",
  // custom data goes here
  "meta": { 
    "Environment": "Prod",
    "Status":"Succeeded"
  }
}
```
## Request body structure
|property|description|
|-|-|
|`key`|Primary field. Some unique identifier of an event the message relates to.|
|`project`|Primary field. Name that is used in `config.json` as a configuration section with project-specific settings. This name could also be used as name of message card template json file (under `./message_card`).|
|`event`|Primary field. Event name.|
|`meta`|An object that contains custom fields.|

## Groupping and routing logic
Messages are groupped by primary fields `key`, `project`, `event`. Additionally, any other property of `meta` object can be included into filtering of group members.


The behavior is determined by `groupBy` and `webhookRules` configuration properties located under `%environment% > datasources > %project% > events > %event%` sections in `config.json`.

### groupBy
An array of paths/queries to object data. Resolved by [json-query](https://www.npmjs.com/package/json-query). Used for grouping, optionally by a custom field.

Example:
```javascript
  // message:
  {
    ...
    meta: {
      'Env': 'Prod'
    }
    ...
  }
```
```javascript
  // groupBy example
  groupBy: ['meta.Env']
  // will be resolved as 'Prod'
```

### webhookRules
Set of rules (array) which determine what webhook URL to checking that all conditions are met. Each rule consists of `conditions` and `url` properties. If this section was not specified then default `url` property (webhookRules sibling) will be used.

#### conditions

Array of conditions. Each condition has `fieldQuery` and `fieldPattern`

`fieldQuery` - [json-query](https://www.npmjs.com/package/json-query) path to object data. Should also be declared as custom fields in `groupBy`, otherwise notification won't be sent.

`fieldPattern` is a regex pattern for matching `fieldQuery` result.

Example:
```javascript
  // message:
  {
    ...
    meta: {
      'Env': 'Prod',
      'Channel': 'Unstable'
    }
    ...
  }
```
```javascript
  // config.json
  ...
  // groupBy
  groupBy: ['meta.Env', 'meta.Channel']
  ...
  webhookRules: [
    {
      conditions: [
        {
          fieldQuery: 'meta.Env',
          fieldPattern: 'Prod'
        },
        {
          fieldQuery: 'meta.Channel',
          fieldPattern: 'Stable'
        },
      ],
      url: 'http://example.com/1'
    },
    {
      conditions: [
        {
          fieldQuery: 'meta.Env',
          fieldPattern: 'Prod'
        },
        {
          fieldQuery: 'meta.Channel',
          fieldPattern: 'Unstable'
        },
      ],
      url: 'http://example.com/2'
    } 
  ]
  ...
  // message won't be sent as notification to 
  // http://example/1
  // because condition #2 failed

  // message will be sent to
  // http://example/1
  // all conditions succeeded
```
### maxBatchSize
Expected number of messages that will be combined into one notification. If not specified default value `1` will be used.

### timeOutMinutes
How much time to wait for a batch to become complete. When this timeout has been reached a notification will be created from incomplete batch of messages.

If not specified default value `5` will be used.

# Message card templating
Message cards are rendered using a json template and data that was passed to it (an array of similar messages). [json4json](https://baffinlee.com/json4json/) templating engine is used.

When a group of messages is ready to be transformed into a message card, the service looks for a template named the same as value of `project` field and if not found falls back to `default.json`.

Templates are stored inside of the `./message_card` folder.