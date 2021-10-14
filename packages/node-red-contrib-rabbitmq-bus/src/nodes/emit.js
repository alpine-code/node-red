const status = require('../util/nodeStatus');

module.exports = function (RED) {

    function BusEmit(config) {
        RED.nodes.createNode(this, config);

        this.name = config.emitName;
        this.exchangeName = config.exchangeName;

        var node = this;

        // retrive the values from the rabbitmq-bus-config node
        node.busConfig= RED.nodes.getNode(config.host);

        // TRIGGER ON INCOMING MESSAGE
        node.on('input', async function (msg) {
            status.clear(node);
            
            let exchangeName = (msg.exchangeName) ? msg.exchangeName : node.exchangeName;

            try {
                let result = await node.busConfig.get().emit(exchangeName, msg.payload);
            } catch (err) {
                node.error(err.message, msg);
                status.error(node, err.message);
            }
        });

    }
    RED.nodes.registerType("rabbitmq-bus-emit", BusEmit);
}