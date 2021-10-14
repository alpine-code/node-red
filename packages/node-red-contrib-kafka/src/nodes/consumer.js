const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {
  const { Kafka } = require('kafkajs');
  const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry')
  const { v4: uuidv4 } = require('uuid');

  function KafkaConsumerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.kafka = config.kafka;
    node.kafkaConfig = RED.nodes.getNode(node.kafka);

    const kafka = new Kafka(node.kafkaConfig.kafkaOptions);
    const registry = new SchemaRegistry(node.kafkaConfig.schemaRegistryOptions);

    const consumerOptions = new Object();
    consumerOptions.groupId = config.groupId ? config.groupId : "kafka_js_" + uuidv4();
    const subscribeOptions = new Object();
    subscribeOptions.topic = config.topic;

    const runOptions = new Object();

    if (config.advancedOptions) {
      consumerOptions.sessionTimeout = config.sessionTimeout;
      consumerOptions.rebalanceTimeout = config.rebalanceTimeout;
      consumerOptions.heartbeatInterval = config.heartbeatInterval;
      consumerOptions.metadataMaxAge = config.metadataMaxAge;
      consumerOptions.allowAutoTopicCreation = config.allowAutoTopicCreation;
      consumerOptions.maxBytesPerPartition = config.maxBytesPerPartition;
      consumerOptions.minBytes = config.minBytes;
      consumerOptions.maxBytes = config.maxBytes;
      consumerOptions.maxWaitTimeInMs = config.maxWaitTimeInMs;

      subscribeOptions.fromBeginning = config.fromBeginning;

      runOptions.autoCommitInterval = config.autoCommitInterval;
      runOptions.autoCommitThreshold = config.autoCommitThreshold;
    }

    node.init = async function init() {
      if (config.advancedOptions && config.clearOffsets) {
        node.status({ fill: "yellow", shape: "ring", text: "Clearing Offset" });
        var admin = kafka.admin();
        await admin.connect();
        await admin.resetOffsets({ groupId: config.groupId, topic: config.topic });
        await admin.disconnect()
      }

      node.consumer = kafka.consumer(consumerOptions);
      node.status({ fill: "yellow", shape: "ring", text: "Initializing" });

      node.onConnect = function () {
        node.lastMessageTime = new Date().getTime();
        node.status({ fill: "green", shape: "ring", text: "Ready" });
      }

      node.onDisconnect = function () {
        node.status({ fill: "red", shape: "ring", text: "Offline" });
      }

      node.onRequestTimeout = function () {
        node.status({ fill: "red", shape: "ring", text: "Timeout" });
      }

      node.onError = function (e) {
        node.error("Kafka Consumer Error", e.message);
        node.status({ fill: "red", shape: "ring", text: "Error" });
      }

      node.onMessage = async function (topic, partition, message) {
        node.lastMessageTime = new Date().getTime();
        var payload = new Object();
        payload.topic = topic;
        payload.partition = partition;

        payload.payload = new Object();
        payload.payload = message;

        // payload.payload.key = message.key ? message.key.toString() : null;
        // payload.payload.value = message.value.toString();

        payload.payload.key = await registry.decode(message.key)
        payload.payload.value = await registry.decode(message.value)

        for (const [key, value] of Object.entries(payload.payload.headers)) {
          payload.payload.headers[key] = value.toString();
        }

        node.send(payload);
        node.status({ fill: "blue", shape: "ring", text: "Reading" });
      }

      function checkLastMessageTime() {
        if (node.lastMessageTime != null) {
          timeDiff = new Date().getTime() - node.lastMessageTime;
          if (timeDiff > 5000) {
            node.status({ fill: "yellow", shape: "ring", text: "Idle" });
          }
        }
      }

      node.interval = setInterval(checkLastMessageTime, 1000);

      node.consumer.on(node.consumer.events.CONNECT, node.onConnect);
      node.consumer.on(node.consumer.events.DISCONNECT, node.onDisconnect);
      node.consumer.on(node.consumer.events.REQUEST_TIMEOUT, node.onRequestTimeout);

      await node.consumer.connect();
      await node.consumer.subscribe(subscribeOptions);

      runOptions.eachMessage = async ({ topic, partition, message }) => {
        node.onMessage(topic, partition, message);
      }

      await node.consumer.run(runOptions);
    }

    node.init().catch(err => {
      node.onError(err);
    });

    node.on('close', function (done) {
      node.consumer.disconnect().then(() => {
        node.status({});
        clearInterval(node.interval);
        done();
      }).catch(err => {
        node.onError(err);
      });
    });

  }

  RED.nodes.registerType('kafka-consumer', KafkaConsumerNode);
}
