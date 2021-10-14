const logger = require('../util/logger');
const status = require('../util/nodeStatus');
const salesforceHelper = require('../util/salesforceHelper');

module.exports = function (RED) {
  'use strict';

  function SalesforceOperationNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.salesforce = config.salesforce;
    node.salesforceConfig = RED.nodes.getNode(node.salesforce);

    if (node.salesforceConfig) {

      node.on('input', function (msg) {

        node.sobject = msg.sobject || config.sobject;
        node.extname = msg.extname || config.extname;
        node.maxfetch = msg.maxfetch || config.maxfetch;
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

            case 'query':
              var records = [];
              //msg.payload = salesforceHelper.convType(msg.payload, 'string');
              var query = conn.query(msg.payload)
                .on("record", function (record) {
                  records.push(record);
                })
                .on("end", function () {
                  node.sendMsg(null, records);
                })
                .on("error", function (err) {
                  node.sendMsg(err);
                })
                .run({ autoFetch: true, maxFetch: node.maxfetch });
              break;

            case 'create':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.sobject(node.sobject).create(msg.payload, node.sendMsg);
              break;

            case 'update':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.sobject(node.sobject).update(msg.payload, node.sendMsg);
              break;

            case 'upsert':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.sobject(node.sobject).upsert(msg.payload, node.extname, node.sendMsg);
              break;

            case 'delete':
              //msg.payload = salesforceHelper.convType(msg.payload, 'object');
              conn.sobject(node.sobject).destroy(msg.payload, node.sendMsg);
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

  RED.nodes.registerType('salesforce-operation', SalesforceOperationNode);
}
