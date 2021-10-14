const _ = require('lodash');

const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function GraphQLSubscribeNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.graphql = config.graphql;
    node.graphqlConfig = RED.nodes.getNode(node.graphql);

    if (node.graphqlConfig) {

      let subscription = config.subscription;
      let payload = {};

      try {
        status.info(node, "subscribed");
        node.graphqlConfig.subscribe(subscription, payload).subscribe(result => {
          return node.send({
            payload: result.data,
          });
        }, (err) => {
          console.log(err);
          status.error(node, err.message);
        });
      } catch (err) {
        console.log(err);
        status.error(node, err.message);
      }

    }

  }

  RED.nodes.registerType('graphql-subscribe', GraphQLSubscribeNode);
}
