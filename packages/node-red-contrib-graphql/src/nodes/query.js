const _ = require('lodash');

const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function GraphQLQueryNode(config) {
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

        let query = msg.query || config.query;
        let payload = msg.payload;

        try {
          let result = await node.graphqlConfig.query(query, payload);
          node.sendMsg(null, result.data);
        } catch (err) {
          node.sendMsg(err);
        }

      })
      
    }

  }

  RED.nodes.registerType('graphql-query', GraphQLQueryNode);
}
