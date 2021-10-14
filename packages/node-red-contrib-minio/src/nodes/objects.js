module.exports = function (RED) {
    const helpers = require('./helpers');

    function objects(config) {
        RED.nodes.createNode(this, config);

        this.name = config.objects_name;
        this.operation = config.objects_operation;
        this.bucket = config.objects_bucket;
        this.object = config.objects_object;
        this.offset = config.objects_offset;
        this.length = config.objects_length;
        this.stream = config.objects_stream;
        this.size = config.objects_size;
        this.metadata = config.objects_metadata;
        this.sourceobject = config.objects_sourceobject;
        this.conditions = config.objects_conditions;
        this.objectslist = config.objects_objectslist;
        this.prefix = config.objects_prefix;
        this.etag = config.objects_etag;
        this.datetime = config.objects_datetime;

        var node = this;

        var opParams = {
            'bucketName': node.bucket,
            'objectName': node.object,
            'offset': node.offset,
            'length': node.length,
            'stream': node.stream,
            'size': node.size,
            'metaData': node.metadata,
            'sourceObject': node.sourceobject,
            'conditions': node.conditions,
            'objectsList': node.objectslist,
            'prefix': node.prefix,
            'etag': node.etag,
            'dateTime': node.datetime
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
            opParams.objectName = (msg.objectName) ? msg.objectName : opParams.objectName;
            opParams.offset = (msg.offset) ? msg.offset : opParams.offset;
            opParams.length = (msg.length) ? msg.length : opParams.length;
            opParams.stream = (msg.stream) ? msg.stream : opParams.stream;
            opParams.size = (msg.size) ? msg.size : opParams.size;
            opParams.metaData = (msg.metaData) ? msg.metaData : opParams.metaData;
            opParams.sourceObject = (msg.sourceObject) ? msg.sourceObject : opParams.sourceObject;
            opParams.conditions = (msg.conditions) ? msg.conditions : opParams.conditions;
            opParams.objectsList = (msg.objectsList) ? msg.objectsList : opParams.objectsList;
            opParams.prefix = (msg.prefix) ? msg.prefix : opParams.prefix;
            opParams.etag = (msg.etag) ? msg.etag : opParams.etag;
            opParams.dateTime = (msg.dateTime) ? msg.dateTime : opParams.dateTime;

            // Trigger Bucket Operation type based on "operation" selected in node configuration
            switch (node.operation) {

                // ====  GET OBJECT  ===================================================
                case "getObject":
                    // LIFTED STRAIGHT FROM SPEC - TO BE COMPLETED:
                    var size = 0
                    minioClient.getObject(opParams.bucketName, opParams.objectName, function (err, dataStream) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = {
                                'getObject': false,
                            };
                        }
                        dataStream.on('data', function (chunk) {
                            size += chunk.length
                        })
                        dataStream.on('end', function () {
                            console.log('End. Total size = ' + size)
                        })
                        dataStream.on('error', function (err) {
                            console.log(err)
                        })
                    })
                    break;

                // ====  GET PARTIAL OBJECT  ===========================================
                case "getPartialObject":
                    var size = 0
                    minioClient.getPartialObject(opParams.bucketName, opParams.objectName, parseInt(opParams.offset), parseInt(opParams.length), function (err, dataStream) {
                        helpers.statusUpdate(node, "blue", "dot", 'Attempting getPartialObject...', 5000);
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'getPartialObject': false };
                        }
                        var receivedChunk;
                        dataStream.on('data', function (chunk) {
                            helpers.statusUpdate(node, "blue", "dot", 'Receiving data...', 5000);
                            size += chunk.length;
                            receivedChunk = chunk;
                        })
                        dataStream.on('end', function () {
                            helpers.statusUpdate(node, "green", "dot", 'Object Chunk Received', 5000);
                            node.error = null;
                            node.output = {
                                'getPartialObject': true,
                                'chunk': receivedChunk
                            };
                        })
                        dataStream.on('error', function (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'getPartialObject': false };
                        })
                    })
                    break;

                // ====  PUT OBJECT  ===================================================
                case "putObject":
                    minioClient.putObject(opParams.bucketName, opParams.objectName, opParams.stream, function (err, etag) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'putObject': false };
                        } else {
                            node.error = null;
                            node.output = {
                                'putObject': true,
                                'etag': etag
                            };
                        }
                    })
                    break;

                // ====  COPY OBJECT  ==================================================
                case "copyObject":
                    var Minio = require('minio');
                    var conds = new Minio.CopyConditions();
                    console.log('opParams.conditions', opParams.conditions);
                    switch (opParams.conditions) {
                        case "setMatchETag":
                            console.log('opParams.etag', opParams.etag);
                            conds.setMatchETag(opParams.etag);
                            break;
                        case "setMatchETagExcept":
                            console.log('opParams.etag', opParams.etag);
                            conds.setMatchETagExcept(opParams.etag);
                            break;
                        case "setModified":
                            var d = new Date(opParams.dateTime);
                            console.log('opParams.dateTime', d);
                            conds.setModified(d);
                            break;
                        case "setReplaceMetadataDirective":
                            conds.setReplaceMetadataDirective();
                            break;
                        case "setUnmodified":
                            console.log('opParams.dateTime', opParams.dateTime);
                            conds.setUnmodified(opParams.dateTime);
                            break;
                        case "copyDefault":
                            break;
                    }

                    console.log('conds', conds);

                    minioClient.copyObject(opParams.bucketName, opParams.objectName, opParams.sourceObject, conds, function (err, data) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'copyObject': false };
                        } else {
                            helpers.statusUpdate(node, "green", "dot", 'Object Copied', 5000);
                            node.error = null;
                            node.output = {
                                'copyObject': true,
                                'etag': data.etag,
                                'lastModified': data.lastModified
                            };
                        }
                    })
                    break;

                // ====  STAT OBJECT  ==================================================
                case "statObject":
                    minioClient.statObject(opParams.bucketName, opParams.objectName, function (err, stat) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'statObject': false };
                        } else {
                            node.error = null;
                            node.output = {
                                'statObject': true,
                                'stat': stat
                            };
                        }
                    })
                    break;

                // ====  REMOVE OBJECT  ================================================
                case "removeObject":
                    minioClient.removeObject(opParams.bucketName, opParams.objectName, function (err) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            node.error = err;
                            node.output = { 'removeObject': false };
                        } else {
                            node.error = null;
                            node.output = { 'removeObject': true };
                        }
                    })
                    break;

                // ====  REMOVE OBJECTS  ===============================================
                case "removeObjects":
                    if (opParams.objectsList) {
                        minioClient.removeObjects(opParams.bucketName, JSON.parse(opParams.objectsList), function (err) {
                            if (err) {
                                helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                                node.error = err;
                                node.output = { 'removeObjects': false };
                            } else {
                                node.error = null;
                                node.output = { 'removeObjects': true };
                            }
                        })
                    } else {
                        var objectsList = []

                        var objectsStream = minioClient.listObjects(opParams.bucketName, opParams.prefix, true)

                        objectsStream.on('data', function (obj) {
                            objectsList.push(obj.name);
                        })

                        objectsStream.on('error', function (e) {
                            console.log(e);
                        })

                        objectsStream.on('end', function () {
                            minioClient.removeObjects(opParams.bucketName, objectsList, function (err) {
                                if (err) {
                                    helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                                    node.error = err;
                                    node.output = { 'removeObjects': false };
                                } else {
                                    node.error = null;
                                    node.output = { 'removeObjects': true };
                                }
                            })

                        })
                    }
                    break;

                // ====  REMOVE INCOMPLETE UPLOAD  =====================================
                case "removeIncompleteUpload":
                    // LIFTED STRAIGHT FROM SPEC - TO BE COMPLETED:
                    minioClient.removeIncompleteUpload(opParams.bucketName, opParams.objectName, function (err) {
                        if (err) {
                            helpers.statusUpdate(node, "red", "dot", 'Error', 5000);
                            return console.log('Unable to remove incomplete object', err)
                        }
                        console.log('Incomplete object removed successfully.')
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
    RED.nodes.registerType("minio-objects", objects);
}