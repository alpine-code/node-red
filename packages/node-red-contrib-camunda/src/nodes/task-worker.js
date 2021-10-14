const status = require('../util/nodeStatus');
const { Variables } = require("camunda-external-task-client-js");

module.exports = function(RED) {

    function TaskWorker(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        const workerClient = RED.nodes.getNode(config.camunda).workerClient;

        const handler = async ({ task, taskService }) => {
            node.send({
                payload: {
                    task,
                    taskService,
                    processVariables: new Variables(),
                    localVariables: new Variables()
                },
            });
        };

        workerClient.on("poll:success", function(tasks) {
            status.infoRing(node, 'pooling tasks');
        })
        workerClient.on("poll:error", function(err) {
            status.errorRing(node, err.message);
        })

        workerClient.on("complete:success", function(tasks) {
            status.success(node, 'tasks completed');
        })
        workerClient.on("complete:error", function(tasks, error) {
            status.error(node, err.message);
        })

        workerClient.on("subscribe", function(topic, topicSubscription) {
            if(topic === config.topic) {
                status.success(node, 'connected');
            }
        })

        status.warningRing(node, 'connecting');
        workerClient.subscribe(config.topic, handler);

        node.on('close', () => {});
    }
    RED.nodes.registerType('camunda-task-worker', TaskWorker);
};
