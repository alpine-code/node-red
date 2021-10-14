module.exports = function (RED) {
    const helpers = require('./helpers');

    function policies(config) {
        RED.nodes.createNode(this, config);

        this.name = config.policies_name;
        this.operation = config.policies_operation;
        this.bucket = config.policies_bucket;
        this.policy = config.policies_policy;

        var node = this;

        var opParams = {
            'bucketName': node.bucket,
            'bucketPolicy': node.policy,
        }

        // retrive the values from the minio-config node
        node.minioInstance = RED.nodes.getNode(config.host);

        if (node.minioInstance) {
            var minioClient = node.minioInstance.initialize();
        }

        // TRIGGER ON INCOMING MESSAGE
        node.on('input', function (msg) {
            // If values are provided in the incoming message, then they override those set in the node configuration
            node.operation = (msg.operation) ? msg.operation : node.operation;
            opParams.bucketName = (msg.bucketName) ? msg.bucketName : opParams.bucketName;
            opParams.bucketPolicy = (msg.bucketPolicy) ? msg.bucketPolicy : opParams.bucketPolicy;

            // Trigger Bucket Operation type based on "operation" selected in node configuration
            switch (node.operation) {

                // ====  GET BUCKET POLICY  ===================================================
                case "getBucketPolicy":
                    helpers.statusUpdate(node, "blue", "dot", 'Fetching Bucket Policy...');
                    minioClient.getBucketPolicy(opParams.bucketName, function (err, policy) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.output = { 'getBucketPolicy': false };
                            node.error = err;
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Returned Bucket Policy', 5000);
                            node.output = {
                                'getBucketPolicy': true,
                                'policy': policy
                            };
                            node.error = null;
                        }
                    })

                    break;

                // ====  SET BUCKET POLICY  ===========================================
                case "setBucketPolicy":
                    helpers.statusUpdate(node, "blue", "dot", 'Setting Bucket Policy...');
                    minioClient.setBucketPolicy(opParams.bucketName, JSON.stringify(opParams.bucketPolicy), function (err) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.output = { 'setBucketPolicy': false };
                            node.error = err;
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Set Bucket Policy', 5000);
                            node.output = { 'setBucketPolicy': true };
                            node.error = null;
                        }
                    })

                    break;

                // ====  DEFAULT - INCORRECT SELECTION   ===============================
                case "default":
                    node.error = 'Invalid File Object Operation Selection'
                    node.output = null;
            }

            // Waits until response received from host before sending to node output(s)
            var timerId = setTimeout(function check() {
                if (!node.output) { timerId = setTimeout(check, 50); } else {
                    msg.payload = node.output
                    node.send([msg, { 'payload': node.error }]);
                }
            }, 50);

        });

    }
    RED.nodes.registerType("minio-policies", policies);
}