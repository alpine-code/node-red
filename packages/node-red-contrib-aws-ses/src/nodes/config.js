module.exports = function (RED) {
  const nodemailer = require("nodemailer");
  const aws = require("@aws-sdk/client-ses");

  function AwsSesConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    const ses = new aws.SES({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      apiVersion: "2010-12-01",
      region: config.region,
    });

    const transporter = nodemailer.createTransport({
      SES: { ses, aws },
    });

    node.transporter = transporter;
  }

  RED.nodes.registerType('aws-ses-config', AwsSesConfigNode);
}
