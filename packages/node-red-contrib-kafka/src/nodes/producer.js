const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function KafkaProducerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.kafka = config.kafka;
    node.kafkaConfig = RED.nodes.getNode(node.kafka);

    node.on('input', async function (msg) {
      status.clear(node);

      try {
        status.success(node, ``);
      } catch(err) {
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('kafka-producer', KafkaProducerNode);
}
