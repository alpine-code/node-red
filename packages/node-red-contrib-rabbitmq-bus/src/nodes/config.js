const busHelper = require('../util/busHelper');

module.exports = function (RED) {

    function RabbitMqBusConfigNode(config) {

        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.url = config.url;
        this.namespace = config.namespace;
        this.app = config.app;

        var node = this;

        // Prevents a limit being placed on number of event listeners (otherwise max of 10 by default):
        node.setMaxListeners(0);

        node.busInstance = new busHelper.Bus({
            url: this.url,
            namespace: this.namespace,
            app: this.app
        });

        node.get = function () {
            return node.busInstance;
        }

        node.on('close', async function () {
            return await node.busInstance.close();
        });
    }

    RED.nodes.registerType("rabbitmq-bus-config", RabbitMqBusConfigNode, {
        credentials: {
            url: { type: "text" },
            namespace: { type: "text" },
            app: { type: "text" }
        }
    });
}