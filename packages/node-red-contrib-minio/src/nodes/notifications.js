module.exports = function (RED) {
    const helpers = require('./helpers');
    var Minio = require('minio');

    function notifications(config) {
        RED.nodes.createNode(this, config);

        this.name = config.notifications_name;
        this.operation = config.notifications_operation;
        this.bucket = config.notifications_bucket;
        this.notificationconfig = config.notifications_notificationconfig;
        this.prefix = config.notifications_prefix;
        this.suffix = config.notifications_suffix;
        this.events = config.notifications_events;
        this.events_object_created_put = config.notifications_events_object_created_put;
        this.events_object_created_post = config.notifications_events_object_created_post;
        this.events_object_created_copy = config.notifications_events_object_created_copy;
        this.events_object_created_complete_multipart_upload = config.notifications_events_object_created_complete_multipart_upload;
        this.events_object_removed_delete = config.notifications_events_object_removed_delete;
        this.events_object_accessed_get = config.notifications_events_object_accessed_get;
        this.events_object_accessed_head = config.notifications_events_object_accessed_head;
        this.events_listener_stop = config.notifications_events_listener_stop;

        var node = this;

        var opParams = {
            'bucketName': node.bucket,
            'bucketNotificationConfig': node.notificationconfig,
            'prefix': node.prefix,
            'suffix': node.suffix,
            'events': {
                'objectCreated': {
                    'put': node.events_object_created_put,
                    'post': node.events_object_created_post,
                    'copy': node.events_object_created_copy,
                    'completeMultipartUpload': node.events_object_created_complete_multipart_upload
                },
                'objectRemovedDelete': node.events_object_removed_delete,
                'objectAccessed': {
                    'get': node.events_object_accessed_get,
                    'head': node.events_object_accessed_head
                },
                'listenerStop': node.events_listener_stop
            }
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
            opParams.bucketNotificationConfig = (msg.bucketNotificationConfig) ? msg.bucketNotificationConfig : opParams.bucketNotificationConfig;
            opParams.prefix = (msg.prefix) ? msg.prefix : opParams.prefix;
            opParams.suffix = (msg.suffix) ? msg.suffix : opParams.suffix;
            // opParams.events                   = (msg.events) ? msg.events : opParams.events;
            if (msg.events) { // If msg.events has any values provided in the incoming message, then use them.
                if (msg.events.objectCreated) { // If msg.events.objectCreated has any values provided in the incoming message, then use them.
                    opParams.events.objectCreated.put = (msg.events.objectCreated.put) ? msg.events.objectCreated.put : opParams.events.objectCreated.put;
                    opParams.events.objectCreated.post = (msg.events.objectCreated.post) ? msg.events.objectCreated.post : opParams.events.objectCreated.post;
                    opParams.events.objectCreated.copy = (msg.events.objectCreated.copy) ? msg.events.objectCreated.copy : opParams.events.objectCreated.copy;
                    opParams.events.objectCreated.completeMultipartUpload = (msg.events.objectCreated.completeMultipartUpload) ? msg.events.objectCreated.completeMultipartUpload : opParams.events.objectCreated.completeMultipartUpload;
                }
                opParams.events.objectRemovedDelete = (msg.events.objectRemovedDelete) ? msg.events.objectRemovedDelete : opParams.events.objectRemovedDelete;
                if (msg.events.objectAccessed) { // If msg.events.objectAccessed has any values provided in the incoming message, then use them.
                    opParams.events.objectAccessed.get = (msg.events.objectAccessed.get) ? msg.events.objectAccessed.get : opParams.events.objectAccessed.get;
                    opParams.events.objectAccessed.head = (msg.events.objectAccessed.head) ? msg.events.objectAccessed.head : opParams.events.objectAccessed.head;
                }
                opParams.events.listenerStop = (msg.events.listenerStop) ? msg.events.listenerStop : false;
            }

            // Trigger Bucket Notification Operation type based on "operation" selected in node configuration
            switch (node.operation) {

                // ====  GET BUCKET NOTIFICATION  ===================================================
                case "getBucketNotification":
                    helpers.statusUpdate(node, "blue", "dot", 'Checking Bucket Notification Config...');
                    minioClient.getBucketNotification(opParams.bucketName, function (err, bucketNotificationConfig) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.output = { 'getBucketNotification': false };
                            node.error = err;
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Returned Bucket Notification Config', 5000);
                            node.output = {
                                'getBucketNotification': true,
                                'config': bucketNotificationConfig
                            };
                            node.error = null;
                        }
                    })

                    break;

                // ====  SET BUCKET NOTIFICATION  ===========================================
                case "setBucketNotification":
                    // LIFTED STRAIGHT FROM SPEC - TO BE COMPLETED:

                    // Create a new notification object
                    var bucketNotification = new Minio.NotificationConfig();

                    // Setup a new Queue configuration
                    var arn = Minio.buildARN('aws', 'sqs', 'us-west-2', '1', 'webhook')
                    var queue = new Minio.QueueConfig(arn)
                    queue.addFilterSuffix('.jpg')
                    queue.addFilterPrefix('myphotos/')
                    queue.addEvent(Minio.ObjectReducedRedundancyLostObject)
                    queue.addEvent(Minio.ObjectCreatedAll)

                    // Add the queue to the overall notification object
                    bucketNotification.add(queue)

                    // THE FOLLOWING IS OK:    
                    minioClient.setBucketNotification(opParams.bucketName, bucketNotification, function (err) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.output = { 'setBucketNotification': false };
                            node.error = err;
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Bucket Notification Set', 5000);
                            node.output = { 'setBucketNotification': true };
                            node.error = null;
                        }
                    })

                    break;

                // ====  REMOVE ALL BUCKET NOTIFICATIONS  ===================================================
                case "removeAllBucketNotification":
                    helpers.statusUpdate(node, "blue", "dot", 'Removing Bucket Notifications...');
                    minioClient.removeAllBucketNotification(opParams.bucketName, function (err) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.output = { 'removeAllBucketNotification': false };
                            node.error = err;
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Removed All Bucket Notifications', 5000);
                            node.output = { 'removeAllBucketNotification': true };
                            node.error = null;
                        }
                    })

                    break;

                // ====  LISTEN BUCKET NOTIFICATIONS  ==================================================
                case "listenBucketNotification":
                    helpers.statusUpdate(node, "blue", "dot", 'Setting Bucket Notification Listener...', 5000);

                    console.log(opParams.events);

                    // Build up array of Supported Event Types to listen for:
                    var eventsArray = [];
                    if (opParams.events.objectCreated.put) {
                        eventsArray.push('s3:ObjectCreated:Put');
                    }
                    if (opParams.events.objectCreated.post) {
                        eventsArray.push('s3:ObjectCreated:Post');
                    }
                    if (opParams.events.objectCreated.copy) {
                        eventsArray.push('s3:ObjectCreated:Copy');
                    }
                    if (opParams.events.objectCreated.completeMultipartUpload) {
                        eventsArray.push('s3:ObjectCreated:CompleteMultipartUpload');
                    }
                    if (opParams.events.objectCreated.put) {
                        eventsArray.push('s3:ObjectRemoved:Delete');
                    }
                    if (opParams.events.objectAccessed.get) {
                        eventsArray.push('s3:ObjectAccessed:Get');
                    }
                    if (opParams.events.objectAccessed.head) {
                        eventsArray.push('s3:ObjectAccessed:Head');
                    }

                    if (typeof listener === 'undefined') {
                        var listener = minioClient.listenBucketNotification(opParams.bucketName, opParams.prefix, opParams.suffix, eventsArray);
                    }

                    helpers.statusUpdate(node, "green", "dot", 'Listening for Bucket Notifications...');

                    listener.on('notification', function (record) {
                        helpers.statusUpdate(node, "green", "dot", record.eventName, 5000);
                        console.log(record.eventName);
                        node.send([{ 'payload': { 'listenBucketNotification': record } }, null]);
                        // listener.stop();
                    })
                    break;

                // ====  DEFAULT - INCORRECT SELECTION   ===============================
                case "default":
                    node.error = 'Invalid File Object Operation Selection';
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
    RED.nodes.registerType("minio-notifications", notifications);
}