const status = require('../util/nodeStatus');

module.exports = function (RED) {

    function BusOnAck(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        // TRIGGER ON INCOMING MESSAGE
        node.on('input', function (msg) {
            try {
                msg.ack(msg.error);
                status.clear(node);
            } catch (err) {
                node.error(err.message, msg);
                status.error(node, err.message);
            }
        });

    }
    RED.nodes.registerType("rabbitmq-bus-on-ack", BusOnAck);
}