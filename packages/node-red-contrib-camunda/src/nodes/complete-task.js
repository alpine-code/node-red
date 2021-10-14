const status = require('../util/nodeStatus');

module.exports = function(RED) {
    function CompleteTask(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', async function(msg) {
            const {
                task,
                taskService,
                processVariables,
                localVariables
            } = msg.payload;

            try {
                status.warning(node, 'completing task');
                await taskService.complete(task, processVariables, localVariables);
                status.clear(node);
            } catch (err) {
                node.error(err.message, msg);
                status.error(node, err.message);
            }
        });
    }
    RED.nodes.registerType('camunda-complete-task', CompleteTask);
};