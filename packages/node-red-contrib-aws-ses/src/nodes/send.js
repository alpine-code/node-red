const logger = require('../util/logger');
const status = require('../util/nodeStatus');

module.exports = function (RED) {

  function AwsSesSendNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.awsSes = config.awsSes;
    node.awsSesConfig = RED.nodes.getNode(node.awsSes);

    node.on('input', async function (msg) {
      status.clear(node);

      try {
        let info = await node.awsSesConfig.transporter.sendMail({
          from: msg.from || config.from,
          to: (to => Array.isArray(to) ? to : to.split(/[,; ]+/g))(msg.to || config.to),
          cc: (msg.cc || '').split(/[,; ]+/g),
          bcc: (msg.bcc || '').split(/[,; ]+/g),
          subject: msg.subject || config.subject,
          text: msg.text || config.text,
          html: msg.html || config.html,
        });
        node.send(msg);
        status.success(node, `${info.messageId}`);
      } catch (err) {
        console.log(err)
        node.error(err.message, msg);
        status.error(node, err.message);
      }
    })
  }

  RED.nodes.registerType('aws-ses-send', AwsSesSendNode);
}
