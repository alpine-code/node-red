module.exports = function (RED) {
  const fs = require('fs');
  const { logLevel } = require('kafkajs')

  const dictLogLevel = {
    "warn": logLevel.WARN,
    "debug": logLevel.DEBUG,
    "info": logLevel.INFO,
    "none": logLevel.NOTHING,
    "error": logLevel.ERROR
  }

  function KafkaConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    var schemaRegistryOptions = new Object();
    var kafkaOptions = new Object();
    kafkaOptions.brokers = config.brokers.replace(" ", "").split(",");
    kafkaOptions.clientId = config.clientId;
    kafkaOptions.logLevel = dictLogLevel[config.logLevel];
    kafkaOptions.connectionTimeout = parseInt(config.connectionTimeout);
    kafkaOptions.requestTimeout = parseInt(config.requestTimeout);

    if (config.advancedRetry) {
      kafkaOptions.retry = new Object();
      kafkaOptions.retry.maxRetryTime = parseInt(config.maxRetryTime);
      kafkaOptions.retry.initialRetryTime = parseInt(config.initialRetryTime);
      kafkaOptions.retry.factor = parseFloat(config.factor);
      kafkaOptions.retry.multiplier = parseInt(config.multiplier);
      kafkaOptions.retry.retries = parseInt(config.retries);
    }

    if (config.auth == 'tls') {
      kafkaOptions.ssl = new Object();
      kafkaOptions.ssl.ca = [fs.readFileSync(config.tlsCaCert, 'utf-8')];
      kafkaOptions.ssl.cert = fs.readFileSync(config.tlsClientCert, 'utf-8');
      kafkaOptions.ssl.key = fs.readFileSync(config.tlsPrivateKey, 'utf-8');
      kafkaOptions.ssl.passphrase = config.tlsPasshprase;
      kafkaOptions.ssl.rejectUnauthorized = config.tlsSelfSign;
    } else if (config.auth == 'sasl') {
      kafkaOptions.ssl = config.saslSsl;
      kafkaOptions.sasl = new Object();
      kafkaOptions.sasl.mechanism = config.saslMechanism || 'plain';
      kafkaOptions.sasl.username = node.credentials.saslUsername;
      kafkaOptions.sasl.password = node.credentials.saslPassword;
    }

    schemaRegistryOptions.host = config.schemaRegistryHost;
    schemaRegistryOptions.auth = new Object();
    schemaRegistryOptions.auth.username = config.schemaRegistryUsername;
    schemaRegistryOptions.auth.password = config.schemaRegistryPassword;

    node.kafkaOptions = kafkaOptions;
    node.schemaRegistryOptions = schemaRegistryOptions;
  }

  RED.nodes.registerType('kafka-config', KafkaConfigNode, {
    credentials: {
      saslUsername: { type: "text" },
      saslPassword: { type: "password" }
    }
  });
}
