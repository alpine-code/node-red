module.exports = function (RED) {

    const helpers = require('./helpers');

    function Buckets(config) {
        RED.nodes.createNode(this, config);

        this.name = config.buckets_name;
        this.operation = config.buckets_operation;
        this.bucket = config.buckets_bucket;
        this.region = config.buckets_region;
        this.prefix = config.buckets_prefix;
        this.recursive = config.buckets_recursive;
        this.start_after = config.buckets_start_after;

        var node = this;

        var opParams = {
            'bucketName': node.bucket,
            'region': node.region,
            'prefix': node.prefix,
            'recursive': node.recursive,
            'startAfter': node.start_after
        }

        // retrive the values from the minio-config node
        node.minioInstance = RED.nodes.getNode(config.host);

        if (node.minioInstance) {
            var minioClient = node.minioInstance.initialize();
        }

        node.status({});

        // TRIGGER ON INCOMING MESSAGE
        node.on('input', function (msg) {
            // If values are provided in the incoming message, then they override those in the node configuration
            node.operation = (msg.operation) ? msg.operation : node.operation;
            opParams.bucketName = (msg.bucketName) ? msg.bucketName : opParams.bucketName;
            opParams.region = (msg.region) ? msg.region : opParams.region;
            opParams.prefix = (msg.prefix) ? msg.prefix : opParams.prefix;
            opParams.recursive = (typeof msg.recursive === 'boolean') ? msg.recursive : opParams.recursive;
            opParams.startAfter = (msg.startAfter) ? msg.startAfter : opParams.startAfter;

            // Trigger Bucket Operation type based on "operation" selected in node configuration
            switch (node.operation) {
                // ====  MAKE BUCKET  ===========================================
                case "makeBucket":
                    helpers.statusUpdate(node, "blue", "dot", 'Making bucket "' + opParams.bucketName + '"');
                    minioClient.makeBucket(opParams.bucketName, opParams.region, function (err) {
                        if (err) {
                            node.output = { 'makeBucket': false };
                            node.error = err;
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.output = { 'makeBucket': true };
                            node.error = null;
                            helpers.statusUpdate(node, "green", "dot", 'Made bucket "' + opParams.bucketName + '"', 3000);
                        }
                    })
                    break;

                // ====  LIST BUCKETS  ===========================================
                case "listBuckets":
                    helpers.statusUpdate(node, "blue", "dot", 'Listing Buckets');
                    minioClient.listBuckets(function (err, buckets) {
                        if (err) {
                            node.error = err;
                            node.output = { 'listBuckets': buckets };
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            node.output = { 'listBuckets': buckets };
                            helpers.statusUpdate(node, "green", "dot", 'Returned ' + buckets.length + ' buckets', 3000);
                        }
                    })
                    break;

                // ====  BUCKET EXISTS  ===========================================
                case "bucketExists":
                    helpers.statusUpdate(node, "blue", "dot", 'Checking if "' + opParams.bucketName + '" exists');
                    minioClient.bucketExists(opParams.bucketName, function (err, exists) {
                        if (err) {
                            node.error = err;
                            node.output = { 'bucketExists': false };
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else if (exists) {
                            node.error = null;
                            node.output = { 'bucketExists': true };
                            helpers.statusUpdate(node, "green", "dot", 'Bucket "' + opParams.bucketName + '" exists', 3000);
                        } else {
                            node.error = null;
                            node.output = { 'bucketExists': false };
                            helpers.statusUpdate(node, "red", "dot", 'Bucket "' + opParams.bucketName + '" doesn\'t exist', 3000);
                        }
                    })
                    break;

                // ====  REMOVE BUCKET  ===========================================
                case "removeBucket":
                    helpers.statusUpdate(node, "blue", "dot", 'Removing "' + opParams.bucketName + '" bucket');
                    minioClient.removeBucket(opParams.bucketName, function (err) {
                        if (err) {
                            node.error = err;
                            node.output = { 'removeBucket': false };
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                        } else {
                            node.error = null;
                            node.output = { 'removeBucket': true };
                            helpers.statusUpdate(node, "green", "dot", 'Bucket "' + opParams.bucketName + '" removed', 3000);
                        };
                    })
                    break;

                // ====  LIST OBJECTS  ===========================================
                case "listObjects":
                    helpers.statusUpdate(node, "blue", "dot", 'Listing objects');
                    var stream = minioClient.listObjects(opParams.bucketName, opParams.prefix, opParams.recursive)
                    var objects = [];
                    stream.on('data', function (obj) {
                        objects.push(obj);
                    });
                    stream.on('error', function (err) {
                        node.error = err;
                        helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                    });
                    stream.on('end', function () {
                        helpers.statusUpdate(node, "green", "dot", 'Returned ' + objects.length + ' objects', 3000);
                        node.output = { 'listObjects': objects };
                        node.error = null;
                    });
                    break;

                // ====  LIST OBJECTS V2  ===========================================
                case "listObjectsV2":
                    helpers.statusUpdate(node, "blue", "dot", 'Listing Objects');
                    var stream = minioClient.listObjectsV2(opParams.bucketName, opParams.prefix, opParams.recursive, opParams.startAfter)
                    var objects = [];
                    stream.on('data', function (obj) {
                        objects.push(obj);
                    });
                    stream.on('error', function (err) {
                        node.error = err;
                        helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                    });
                    stream.on('end', function () {
                        helpers.statusUpdate(node, "green", "dot", 'Returned ' + objects.length + ' objects', 3000);
                        node.output = { 'listObjectsV2': objects };
                        node.error = null;
                    });
                    break;

                // ====  LIST OBJECTS V2 WITH META DATA  ===========================================
                case "listObjectsV2WithMetadata":
                    helpers.statusUpdate(node, "blue", "dot", 'Listing Objects');
                    var stream = minioClient.extensions.listObjectsV2WithMetadata(opParams.bucketName, opParams.prefix, opParams.recursive, opParams.startAfter)
                    var objects = [];
                    stream.on('data', function (obj) {
                        objects.push(obj);
                    });
                    stream.on('error', function (err) {
                        node.error = err;
                        helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                    });
                    stream.on('end', function () {
                        helpers.statusUpdate(node, "green", "dot", 'Returned ' + objects.length + ' objects', 3000);
                        node.output = { 'listObjectsV2WithMetadata': objects };
                        node.error = null;
                    });
                    break;

                // ====  LIST INCOMPLETE UPLOADS  ===========================================
                case "listIncompleteUploads":
                    helpers.statusUpdate(node, "blue", "dot", 'Listing Incomplete Uploads');
                    var stream = minioClient.listIncompleteUploads(opParams.bucketName, opParams.prefix, opParams.recursive)
                    var objects = [];
                    stream.on('data', function (obj) {
                        objects.push(obj);
                    });
                    stream.on('error', function (err) {
                        node.error = err;
                        helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                    });
                    stream.on('end', function () {
                        helpers.statusUpdate(node, "green", "dot", 'Returned ' + objects.length + ' objects', 3000);
                        node.output = { 'listIncompleteUploads': objects };
                        node.error = null;
                    });
                    break;

                // ====  DEFAULT - INCORRECT SELECTION   ===========================================
                case "default":
                    node.error = 'Invalid Bucket Operation Selection'
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
    RED.nodes.registerType("minio-buckets", Buckets);
}