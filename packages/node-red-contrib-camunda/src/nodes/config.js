const logger = require('../util/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = function (RED) {
    const { Client, Variables, BasicAuthInterceptor, logger } = require("camunda-external-task-client-js");
    const CamundaSDK = require("../vendor/camunda-bpm-sdk-js");

    function CamundaConfigNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const options = {
            baseUrl: config.baseUrl,
            basicAuth: config.basicAuth,
            username: config.username,
            password: config.password
        };

        // API Client
        let headers = null;
        if(options.basicAuth) {
            headers = {
                Authorization: `Basic ${Buffer.from(`${options.username}:${options.password}`).toString("base64")}`
            }
        }
        node.apiClient = new CamundaSDK.Client({
            mock: false,
            apiUri: options.baseUrl,
            headers: headers
        });
        node.processDefinitionService = new node.apiClient.resource('process-definition');
        node.processInstanceService = new node.apiClient.resource('process-instance');
        node.messageService = new node.apiClient.resource('message');
        node.deploymentService = new node.apiClient.resource('deployment');

        // Worker Client
        let interceptors = null;
        if(options.basicAuth) {
            interceptors = [
                new BasicAuthInterceptor({
                    username: options.username,
                    password: options.password
                })
            ]
        }
        node.workerClient = new Client({
            baseUrl: options.baseUrl,
            use: logger,
            workerId: uuidv4(),
            interceptors: interceptors
        });

        node.on('close', function (done) {
            return node.workerClient.stop().then(() => {
                node.log('Polling stopped');
                done();
            });
        });
    }

    RED.nodes.registerType('camunda-config', CamundaConfigNode);
};
