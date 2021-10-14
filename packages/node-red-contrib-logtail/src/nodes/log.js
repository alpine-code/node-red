const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function LogtailLogNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.logtail = config.logtail;
    node.logtailConfig = RED.nodes.getNode(node.logtail);

    node.on('input', async function (msg) {
      status.clear(node);

      try {
        switch (msg.level) {
          case "debug":
            await node.logtailConfig.logtail.debug(msg.payload);
            break;
          case "info":
            await node.logtailConfig.logtail.info(msg.payload);
            break;
          case "warn":
            await node.logtailConfig.logtail.warn(msg.payload);
            break;
          case "error":
            await node.logtailConfig.logtail.error(msg.payload);
            break;
          default:
            await node.logtailConfig.logtail.log(msg.payload);
            break;
        }
        status.success(node, `level: ${msg.level}`);
      } catch(err) {
        console.log(err)
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('logtail-log', LogtailLogNode);
}
