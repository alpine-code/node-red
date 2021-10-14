const status = require('../util/nodeStatus');
const camundaHelper = require('../util/camundaHelper');
const { Variables } = require("camunda-external-task-client-js");

module.exports = function(RED) {
    function PublishMessage(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', async function(msg) {
            const camunda = RED.nodes.getNode(config.camunda);

            const messageName = msg.payload.messageName || null;
            const processBusinessKey = msg.payload.processBusinessKey || null;
            let processVariables = msg.payload.processVariables || null;
            let correlationKeys = msg.payload.correlationKeys || null;

            if (processVariables instanceof Variables) {
                processVariables = processVariables.getDirtyVariables();
            }

            if (correlationKeys instanceof Variables) {
                correlationKeys = correlationKeys.getDirtyVariables();
            }

            try {
                const results = await camundaHelper.correlateMessage(camunda, messageName, processBusinessKey, correlationKeys, processVariables)
                msg.payload = { ...msg.payload, results: results };
                
                node.send(msg);
                status.success(node, `${results.length} correlation(s)`);

            } catch (err) {
                node.error(err.message, msg);
                status.error(node, err.message);
            }
        });
    }
    RED.nodes.registerType('camunda-publish-message', PublishMessage);
};
