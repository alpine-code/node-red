const logger = require('../util/logger');
const status = require('../util/nodeStatus');
const salesforceHelper = require('../util/salesforceHelper');

module.exports = function (RED) {
    'use strict';

    function SalesforceStreamNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.salesforce = config.salesforce;
        node.salesforceConfig = RED.nodes.getNode(node.salesforce);
        node.topic = config.topic;

        if (node.salesforceConfig) {

            status.warningRing(node, 'connecting');


            node.sendMsg = function (err, result) {
                if (err) {
                    status.error(node, err.message);
                } else {
                    status.clear(node);
                }
                var msg = {};
                msg.payload = result;
                return node.send(msg);
            };

            node.salesforceConfig.login(null, function (err, conn) {
                if (err) {
                    return status.error(node, err.message);
                }
                status.infoRing(node, "connected");
                conn.streaming.topic(node.topic).subscribe(function (message) {
                    node.sendMsg(null, message);
                });

            });

        } else {
            var err = new Error('missing force configuration');
            node.error(err.message, msg);
            status.error(node, err.message);
        }

    }

    RED.nodes.registerType('salesforce-stream', SalesforceStreamNode);
}
