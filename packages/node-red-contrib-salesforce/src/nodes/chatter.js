const logger = require('../util/logger');
const status = require('../util/nodeStatus');
const salesforceHelper = require('../util/salesforceHelper');

module.exports = function (RED) {
  'use strict';

  function SalesforceChatterNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.salesforce = config.salesforce;
    node.salesforceConfig = RED.nodes.getNode(node.salesforce);

    if (node.salesforceConfig) {

      node.on('input', function (msg) {

        node.path = msg.path || config.path;
        node.operation = msg.operation || config.operation;

        status.info(node, "processing");

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

        node.salesforceConfig.login(msg, function (err, conn) {
          if (err) {
            return node.sendMsg(err);
          }
          switch (node.operation) {

            case 'retrieve':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.chatter.resource(node.path).retrieve(node.sendMsg);
              break;

            case 'create':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.chatter.resource(node.path).create(msg.payload, node.sendMsg);
              break;
              
          }
        });
      });

    } else {
      var err = new Error('missing force configuration');
      node.error(err.message, msg);
      status.error(node, err.message);
    }

  }

  RED.nodes.registerType('salesforce-chatter', SalesforceChatterNode);
}
