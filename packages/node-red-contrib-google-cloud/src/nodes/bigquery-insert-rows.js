const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function GoogleCloudNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.googleCloud = config.googleCloud;
    node.googleCloudConfig = RED.nodes.getNode(node.googleCloud);

    node.on('input', async function (msg) {
      status.clear(node);

      try {
        await node.googleCloudConfig.bigQuery.dataset(config.datasetName).table(config.tableName).insert(msg.payload.rows)
        status.success(node, `Inserted ${msg.payload.rows.length} rows`);
      } catch (err) {
        console.log(err)
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('google-cloud-bigquery-insert-rows', GoogleCloudNode);
}
