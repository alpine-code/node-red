var Minio = require('minio');

const helpers = require('./helpers');

module.exports = function (RED) {

    function MinioConfigNode(config) {

        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.host = config.host;
        this.port = parseInt(config.port);
        this.useSsl = config.useSsl;

        var node = this;

        // Prevents a limit being placed on number of event listeners (otherwise max of 10 by default):
        node.setMaxListeners(0);

        node.initialize = function () {

            try {

                this.minioClient = new Minio.Client({
                    endPoint: this.host,
                    port: this.port,
                    useSSL: this.useSsl,
                    accessKey: this.credentials.accessKey,
                    secretKey: this.credentials.secretKey
                });


                return this.minioClient;
            }
            catch (err) {
                console.log(err);
            }
        }

        node.on('close', function () {
            node.removeAllListeners("minio_status");
        });
    }

    RED.nodes.registerType("minio-config", MinioConfigNode, {
        credentials: {
            accessKey: { type: "text" },
            secretKey: { type: "password" }
        }
    });
}