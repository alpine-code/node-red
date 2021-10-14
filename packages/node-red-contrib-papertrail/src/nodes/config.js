module.exports = function (RED) {
  const winston = require('winston');
  require('winston-syslog').Syslog;

  function PapertrailConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // emerg: 0,
    // alert: 1,
    // crit: 2,
    // error: 3,
    // warning: 4,
    // notice: 5,
    // info: 6,
    // debug: 7

    const logger = winston.createLogger({
      level: 'debug',
      levels: winston.config.syslog.levels,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`)
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.Syslog({
          host: config.host,
          port: config.port,
          app_name: config.appName
        })
      ]
    });

    node.logger = logger;    
  }

  RED.nodes.registerType('papertrail-config', PapertrailConfigNode);
}
