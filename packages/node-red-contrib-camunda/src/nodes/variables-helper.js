const status = require('../util/nodeStatus');
const uuid = require('uuid');
const { Variables } = require("camunda-external-task-client-js");

module.exports = function(RED) {
    function VariablesHelper(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg) {
            msg.variables = Variables;
            node.send(msg)
        });
    }
    RED.nodes.registerType('camunda-variables-helper', VariablesHelper);
};
