const { BigQuery } = require('@google-cloud/bigquery');

module.exports = function (RED) {

  function GoogleCloudConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    const serviceAccount = JSON.parse(node.credentials.serviceAccount)

    const bigQuery = new BigQuery({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
      }
    });

    node.bigQuery = bigQuery;
  }

  RED.nodes.registerType('google-cloud-config', GoogleCloudConfigNode, {
    credentials: {
      projectId: { type: "text" },
      serviceAccount: { type: "text" }
    }
  });
}
