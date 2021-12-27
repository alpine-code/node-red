const logger = require('../util/logger');
const status = require('../util/nodeStatus');
const _ = require('lodash');

module.exports = function (RED) {

  function GoogleCloudNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.googleCloud = config.googleCloud;
    node.googleCloudConfig = RED.nodes.getNode(node.googleCloud);

    node.on('input', async function (msg) {
      status.clear(node);

      try {
        const [datasets] = await node.googleCloudConfig.bigQuery.getDatasets();
        status.success(node, `datasets: ${datasets.length}`);
        msg.payload = {
          datasets: _.map(datasets, dataset => {
            return {
              id: dataset.id,
              location: dataset.location
            }
          })
        }
        node.send(msg)
      } catch (err) {
        console.log(err)
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('google-cloud-bigquery-list-datasets', GoogleCloudNode);
}
