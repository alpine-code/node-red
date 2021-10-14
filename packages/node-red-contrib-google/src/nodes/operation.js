const _ = require('lodash');
const {google} = require('googleapis');

const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function GoogleOperationNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.google = config.google;
    node.googleConfig = RED.nodes.getNode(node.google);

    if (node.googleConfig) {

      node.on('input', function (msg) {

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

        node.googleConfig.login(msg, async function (err, conn) {
          if (err) {
            return node.sendMsg(err);
          }

          let apiGoogle = msg.api;
          let payloadGoogle = msg.payload;
          let versionGoogle = msg.version;
          let methodGoogle = msg.method;
          let pathGoogle = msg.path;

          try {
            var request = {
              requestBody: payloadGoogle
            };
            const api = google[apiGoogle]({
              version: versionGoogle,
              auth: conn
            });
            var result = await api[pathGoogle][methodGoogle](request); // TODO Support Paths

            node.sendMsg(null, result);
          } catch (err) {
            node.sendMsg(err);
          }

        })

      })
      
    } else {
      var err = new Error('missing google configuration');
      node.error(err.message, msg);
      status.error(node, err.message);
    }

  }

  RED.nodes.registerType('google-operation', GoogleOperationNode);
}
