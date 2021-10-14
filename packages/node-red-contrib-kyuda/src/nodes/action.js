const gql = require('graphql-tag');
const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function TheLabActionNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.thelab = config.thelab;
    node.thelabConfig = RED.nodes.getNode(node.thelab);

    node.on('input', function (msg) {

      status.info(node, 'processing')

      node.sendMsg = function (err, result) {
        if (err) {
          node.error(err.message, msg);
          status.error(node, err.message);
        } else {
          status.clear(node);
        }
        msg.payload = result;
        return node.send(msg);
      };

      node.thelabConfig.client.mutate({
        mutation: gql`
          mutation createActionExecution($action_uid: String!, $input: jsonb!) {
            create_action_execution(request: {action_uid: $action_uid, input: $input}) {
              id
            }
          }     
        `,
        variables: {
          action_uid: config.action,
          input: msg.payload
        }
      }).then(result => {
        let id = result.data.create_action_execution.id;
        node.sendMsg(null, {
          id
        });
      }).catch(err => {
        node.sendMsg(err);
      })
    })
  }

  RED.nodes.registerType('thelab-action', TheLabActionNode);
}
