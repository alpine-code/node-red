module.exports = function (RED) {
  const { Logtail } = require("@logtail/node");

  function LogtailConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    const logtail = new Logtail(config.sourceToken);

    node.logtail = logtail;    
  }

  RED.nodes.registerType('logtail-config', LogtailConfigNode);
}
