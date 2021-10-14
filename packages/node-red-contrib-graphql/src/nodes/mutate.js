const _ = require('lodash');

const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function GraphQLMutateNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.graphql = config.graphql;
    node.graphqlConfig = RED.nodes.getNode(node.graphql);

    if (node.graphqlConfig) {

      node.on('input', async function (msg) {

        status.info(node, "processing");

        node.sendMsg = function (err, result) {
          if (err) {
            node.error(err.message, msg);
            status.error(node, err.message);
            msg.error = err;
          } else {
            status.clear(node);          
            msg.payload = result;
          }
          return node.send(msg);
        };

        let mutation = msg.mutation || config.mutation;
        let payload = msg.payload;

        try {
          let result = await node.graphqlConfig.mutate(mutation, payload);
          node.sendMsg(null, result.data);
        } catch (err) {
          node.sendMsg(err);
        }

      })
    
    }

  }

  RED.nodes.registerType('graphql-mutate', GraphQLMutateNode);
}
