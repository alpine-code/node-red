module.exports = function (RED) {
    const helpers = require('./helpers');

    function Presigned(config) {
        RED.nodes.createNode(this, config);

        this.name = config.presigned_name;
        this.operation = config.presigned_operation;
        this.bucket = config.presigned_bucket;
        this.object = config.presigned_object;
        this.expiry = config.presigned_expiry;
        this.req_params = config.presigned_req_params;
        this.resp_headers = config.presigned_resp_headers;
        this.issue = config.presigned_issue;
        this.policy_bucket = config.presigned_policy_bucket;
        this.policy_key = config.presigned_policy_key;
        this.policy_key_prefix = config.presigned_policy_key_prefix;
        this.policy_expires = config.presigned_policy_expires;
        this.policy_content_type = config.presigned_policy_content_type;
        this.policy_content_length_range_from = config.presigned_policy_content_length_range_from;
        this.policy_content_length_range_to = config.presigned_policy_content_length_range_to;

        var node = this;

        var opParams = {
            'bucketName': node.bucket,
            'objectName': node.object,
            'expiry': parseInt(node.expiry),
            'reqParams': node.req_params,
            'respHeaders': node.resp_headers,
            'requestDate': node.issue,
            'policy': {
                'setBucket': node.policy_bucket,
                'setKey': node.policy_key,
                'setKeyStartsWith': node.policy_key_prefix,
                'setExpires': node.policy_expires,
                'setContentType': node.policy_content_type,
                'setContentLengthRange': {
                    'from': node.policy_content_length_range_from,
                    'to': node.policy_content_length_range_to
                }
            }
        }

        // retrive the values from the minio-config node
        node.minioInstance = RED.nodes.getNode(config.host);

        if (node.minioInstance) {
            var minioClient = node.minioInstance.initialize();
        }

        // TRIGGER ON INCOMING MESSAGE

        node.on('input', function (msg) {
            // If values are provided in the incoming message, then they override those in the node configuration
            node.operation = (msg.operation) ? msg.operation : node.operation;
            opParams.bucketName = (msg.bucketName) ? msg.bucketName : opParams.bucketName;
            opParams.objectName = (msg.objectName) ? msg.objectName : opParams.objectName;
            opParams.expiry = (msg.expiry) ? msg.expiry : opParams.expiry;
            opParams.reqParams = (msg.reqParams) ? msg.reqParams : opParams.reqParams;
            opParams.respHeaders = (msg.respHeaders) ? msg.respHeaders : opParams.respHeaders;
            opParams.requestDate = (msg.requestDate) ? msg.requestDate : opParams.requestDate;
            // ...and for Presigned POST Policy Operations:
            if (msg.policy) { // If msg.policy has any values provided in the incoming message, then use them.
                opParams.policy.setBucket = (msg.policy.setBucket) ? msg.policy.setBucket : opParams.policy.setBucket;
                opParams.policy.setKey = (msg.policy.setKey) ? msg.policy.setKey : opParams.policy.setKey;
                opParams.policy.setKeyStartsWith = (msg.policy.setKeyStartsWith) ? msg.policy.setKeyStartsWith : opParams.policy.setKeyStartsWith;
                opParams.policy.setExpires = (msg.policy.setExpires) ? msg.policy.setExpires : opParams.policy.setExpires;
                opParams.policy.setContentType = (msg.policy.setContentType) ? msg.policy.setContentType : opParams.policy.setContentType;
                if (msg.policy.setContentLengthRange) { // If msg.policy.setContentLengthRange has any values provided in the incoming message, then use them.
                    opParams.policy.setContentLengthRange.from = (msg.policy.setContentLengthRange.from) ? msg.policy.setContentLengthRange.from : opParams.policy.setContentLengthRange.from;
                    opParams.policy.setContentLengthRange.to = (msg.policy.setContentLengthRange.to) ? msg.policy.setContentLengthRange.to : opParams.policy.setContentLengthRange.to;
                }
            }

            console.log('node.operation:', node.operation);

            // Trigger Presigned Operation type based on "operation" selected in node configuration
            switch (node.operation) {

                // ====  PRESIGNED URL  ===========================================
                case "presignedURL":
                    helpers.statusUpdate(node, "blue", "dot", 'Fetching presignedURL...');
                    console.log('presignedUrl opParams:', opParams);
                    minioClient.presignedUrl('GET', opParams.bucketName, opParams.objectName, opParams.expiry, function (err, presignedUrl) {
                        if (err) {
                            node.error = err;
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            helpers.statusUpdate(node, "green", "dot", 'Fetched presignedURL', 5000);
                        }
                        node.output = { 'presignedURL': presignedUrl };
                        console.log('presignedUrl:', presignedUrl, '\nError:', err);
                    })
                    break;

                // ====  PRESIGNED GET OBJECT  ===========================================
                case "presignedGetObject":
                    helpers.statusUpdate(node, "blue", "dot", 'Fetching presignedGetObject URL...');
                    minioClient.presignedGetObject(opParams.bucketName, opParams.objectName, opParams.expiry, function (err, presignedUrl) {
                        if (err) {
                            node.error = err;
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            helpers.statusUpdate(node, "green", "dot", 'Fetched presignedGetObject URL', 5000);
                        }
                        node.output = { 'presignedGetObject': presignedUrl };
                    })
                    break;

                // ====  PRESIGNED PUT OBJECT  ===========================================
                case "presignedPutObject":
                    helpers.statusUpdate(node, "blue", "dot", 'Fetching presignedPutObject URL...');
                    minioClient.presignedPutObject(opParams.bucketName, opParams.objectName, opParams.expiry, function (err, presignedUrl) {
                        if (err) {
                            node.error = err;
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            helpers.statusUpdate(node, "green", "dot", 'Fetched presignedPutObject URL', 5000);
                        }
                        node.output = { 'presignedPutObject': presignedUrl };
                    })
                    break;

                // ====  PRESIGNED POST POLICY OPERATION  ===========================================
                case "presignedPostPolicy":
                    helpers.statusUpdate(node, "blue", "dot", 'Creating presignedPostPolicy object...');

                    // ==== CREATE A NEW POLICY OBJECT:
                    var policy = minioClient.newPostPolicy();

                    // ==== POPULATE THE POLICY OBJECT:
                    // Policy restricted only for bucket 'mybucket'.
                    if (opParams.policy.setBucket) {
                        policy.setBucket(opParams.policy.setBucket);
                    }

                    // Restricts incoming objects to those with a defined Key (object name):
                    if (opParams.policy.setKey) {
                        policy.setKey(opParams.policy.setKey);
                    }

                    // Restricts incoming objects to those with a defined setKeyStartsWith:
                    if (opParams.policy.setKeyStartsWith) {
                        policy.setKeyStartsWith(opParams.policy.setKeyStartsWith);
                    }

                    // This sets an option for when (in seconds) the policy will expire:
                    if (opParams.policy.setExpires) {
                        var expires = new Date;
                        expires.setSeconds(opParams.policy.setExpires);
                        policy.setExpires(expires)
                    }

                    // Restricts incoming objects to those of a particular type (eg 'text/plain'):
                    if (opParams.policy.setContentType) {
                        policy.setContentType(opParams.policy.setContentType);
                    }

                    // Restricts incoming objects to those within a defined size range (in bytes (from, to)).
                    if ((opParams.policy.setContentLengthRange.from) && (opParams.policy.setContentLengthRange.to)) {
                        policy.setContentLengthRange(opParams.policy.setContentLengthRange.from, opParams.policy.setContentLengthRange.to);
                    }

                    console.log('POLICY:', policy);

                    // ==== SUBMIT THE POLICY OBJECT:
                    helpers.statusUpdate(node, "blue", "dot", 'Submitting presignedPostPolicy object...');
                    minioClient.presignedPostPolicy(policy, function (err, data) {
                        if (err) {
                            node.error = err;
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            helpers.statusUpdate(node, "green", "dot", 'Submitted presignedPostPolicy', 5000);
                        }
                        node.output = { 'presignedPostPolicy': data };
                    });

                    break;
                // ====  DEFAULT - INCORRECT SELECTION   ===========================================
                case "default":
                    node.error = 'Invalid Presigned Operation Selection';
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
    RED.nodes.registerType("minio-presigned", Presigned);
}