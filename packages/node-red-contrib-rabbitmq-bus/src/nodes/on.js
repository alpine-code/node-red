const status = require('../util/nodeStatus');

module.exports = function (RED) {

    function BusOn(config) {
        RED.nodes.createNode(this, config);

        this.name = config.emitName;
        this.exchangeName = config.exchangeName;
        this.consumerName = config.consumerName;

        var node = this;

        // retrive the values from the rabbitmq-bus-config node
        node.busConfig= RED.nodes.getNode(config.host);

        const handler = (payload, done) => {
            status.info(node, "Message");
            node.send({
                ack: function(err) {
                    if(err) {
                        status.warning(node, "NoAck");
                    } else {
                        status.success(node, "Ack");
                    }
                    return done(err)
                },
                payload
            });
        };

        // TRIGGER ON INCOMING MESSAGE
        node.busConfig.get().onRetry(node.exchangeName, node.consumerName, handler);

    }
    RED.nodes.registerType("rabbitmq-bus-on", BusOn);
}