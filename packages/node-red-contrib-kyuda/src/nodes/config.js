const fetch = require('node-fetch');

module.exports = function (RED) {
  function KyudaConfig(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.triggerSource = async function (source_uid, payload) {
      console.log(`https://api.kyuda.io/v1/red/sources/${source_uid}`)
      return fetch(`https://api.kyuda.io/v1/red/sources/${source_uid}`, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json());
    }
    node.triggerPipeline = async function (pipeline_uid, payload) {
      console.log(`https://api.kyuda.io/v1/red/pipelines/${pipeline_uid}`)
      return fetch(`https://api.kyuda.io/v1/red/pipelines/${pipeline_uid}`, {
        method: 'post',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json());
    }
  }

  RED.nodes.registerType('kyuda-config', KyudaConfig);

  RED.httpAdmin.get('/kyuda/:id/sources', async function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    const sources = fetch("https://api.kyuda.io/v1/red/sources")
      .then(response => response.json());
    return res.json(sources)
  })

  RED.httpAdmin.get('/kyuda/:id/pipelines', async function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    const pipelines = fetch("https://api.kyuda.io/v1/red/pipelines")
      .then(response => response.json());
    return res.json(pipelines)
  })
}
