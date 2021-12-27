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
        const [dataset] = await node.googleCloudConfig.bigQuery.createDataset(config.datasetName);
        status.success(node, `dataset: ${dataset.id}`);
        msg.payload = {
          dataset: {
            id: dataset.id, 
            location: dataset.location
          }
        }
        node.send(msg)
      } catch (err) {
        console.log(err)
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('google-cloud-bigquery-create-dataset', GoogleCloudNode);
}
