const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function PapertrailLogNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.papertrail = config.papertrail;
    node.papertrailConfig = RED.nodes.getNode(node.papertrail);

    node.on('input', function (msg) {
      node.papertrailConfig.logger.log({
        level: msg.level || 'debug',
        message: msg.payload
      });
    })
  }

  RED.nodes.registerType('papertrail-log', PapertrailLogNode);
}
