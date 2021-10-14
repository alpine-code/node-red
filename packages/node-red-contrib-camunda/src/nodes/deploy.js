const status = require('../util/nodeStatus');
const camundaHelper = require('../util/camundaHelper');

module.exports = function(RED) {
    function Deploy(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', async function(msg) {
            const camunda = RED.nodes.getNode(config.camunda);

            const deploymentName = msg.payload.deploymentName || null;
            const source = msg.payload.source || null;

            try {
                const results = await camundaHelper.deployProcessDefinition(camunda, deploymentName, source)
                msg.payload = { ...msg.payload, results: results };

                node.send(msg);
                status.success(node, msg.payload.results.id);

            } catch (err) {
                node.error(err.message, msg);
                status.error(node, err.message);
            }
        });
    }

    RED.nodes.registerType('camunda-deploy', Deploy);
};
