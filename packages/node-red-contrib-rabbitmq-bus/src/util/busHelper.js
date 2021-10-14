/*!
 * lib-bus
 */

/**
 * Module debug.
 */

var debug = require('debug')('bus');

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var amqp = require('amqplib');
var uuid = require('node-uuid');

/**
 * Errors
 */

var BusError = require('./errors/BusError');

/**
 * Expose `Bus`.
 */
// exports.configure = function (config) {
//     if (!Bus.singleton) {
//         Bus.singleton = new Bus(config);
//     } else {
//         throw new Error('Bus is already configured.');
//     }
// };

/**
 * Expose `Bus`.
 */

// exports.get = function () {
//     if (Bus.singleton) {
//         return Bus.singleton
//     } else {
//         throw new Error('Bus is not configured.');
//     }
// };

/**
 * Initialize a new `Bus`.
 *
 * @api public
 */

function Bus(options) {
    var self = this;
    self.events = new EventEmitter();
    self.config = {
        url: '',
        namespace: '',
        app: ''
    };
    if (typeof options == 'string' || options instanceof String) {
        self.config.url = options;
        self.config.namespace = 'unknown';
        self.config.app = 'unknown';
    } else {
        self.config.url = options.url;
        self.config.namespace = options.namespace;
        self.config.app = options.namespace;
    }
    self.connection = amqp.connect(self.config.url, {
        noDelay: true,
        keepAlive: true
    }).then(function (connection) {

        connection.on('error', function (err) {
            console.error('[RabbitMQ] error', err);
            self.events.emit('error', err);
        });
        connection.on('close', function () {
            console.log('[RabbitMQ] close');
            self.events.emit('close');
        });
        connection.on('blocked', function () {
            console.log('[RabbitMQ] blocked');
            self.events.emit('blocked');
        });
        connection.on('unblocked', function () {
            console.log('[RabbitMQ] unblocked');
            self.events.emit('unblocked');
        });

        console.log('[RabbitMQ] connected');
        self.events.emit('connected');

        return connection; // Promise

    }).catch(function (err) {
        console.error('[RabbitMQ] error (catch)', err);
        self.events.emit('error', err);
    });
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

Bus.prototype.__proto__ = EventEmitter.prototype;

/**
 * Methods...
 */

Bus.prototype.emit = function (exchange_name, data) {
    var self = this;
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertExchange(exchange_name, 'direct', {
                durable: true,
                autoDelete: false
            });
            ok = ok.then(function () {
                return ch.publish(exchange_name, '', Buffer.from(JSON.stringify(data)), {
                    persistent: true,
                    appId: self.config.app
                });
            });
            return ok.then(function () {
                return ch.close();
            })
        })
    })
};

Bus.prototype.on = function (exchange_name, consumer_name, consumer) {
    var self = this;
    var queue_name = [
        exchange_name,
        '(' + self.config.namespace + ')',
        '(' + consumer_name + ')'
    ].join('-');
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertExchange(exchange_name, 'direct', {
                durable: true,
                autoDelete: false
            });
            ok = ok.then(function () {
                return ch.assertQueue(queue_name, {
                    exclusive: false
                });
            });
            ok = ok.then(function (qok) {
                return ch.bindQueue(qok.queue, exchange_name, '').then(function () {
                    return qok.queue;
                });
            });
            ok = ok.then(function (queue) {
                ch.prefetch(1);
                return ch.consume(queue, processMessage, {
                    noAck: false
                });
            });
            return ok.then(function () {
                console.log('[RabbitMQ] Waiting for messages delivered to queue (on): ' + queue_name);
            });
            function processMessage(msg) {
                if (consumer) {
                    consumer(JSON.parse(msg.content), function (err) {
                        if (err) {
                            console.error('[RabbitMQ] Message rejected', msg, err);
                            return ch.reject(msg, true);
                        } else {
                            return ch.ack(msg);
                        }
                    });
                } else {
                    throw new Error('[RabbitMQ] Consumer is null');
                }
            }
        });
    });
};

// ---

function queueName(exchange_name, namespace, consumer_name) {
    var queue_name = [
        exchange_name,
        '(' + namespace + ')',
        '(' + consumer_name + ')'
    ].join('-');
    return queue_name;
}

function exchangeName(exchange_name, namespace, consumer_name) {
    var queue_name = [
        exchange_name,
        '(' + namespace + ')',
        '(' + consumer_name + ')'
    ].join('-');
    return queue_name;
}

function assertExchanges(channel, exchange_name, namespace, consumer_name) {
    return Promise.all([]
        .concat(
            channel.assertExchange(`${exchange_name}`, 'direct', { durable: true, autoDelete: false }), // direct instead of fanout for backward compatibility, added autoDelete: false
            //channel.assertExchange('A_COMMENT_DELETED', 'fanout', { durable: true }),
            //channel.assertExchange('A_COMMENT_UPDATED', 'fanout', { durable: true })
        )
        .concat(channel.assertExchange(`${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, 'direct', { durable: true }))
        .concat(channel.assertExchange(`${exchangeName(exchange_name, namespace, consumer_name)}-dlx`, 'fanout', { durable: true }))
    );
}
function assertQueues(channel, exchange_name, namespace, consumer_name) {
    return Promise.all([]
        .concat(channel.assertQueue(`${queueName(exchange_name, namespace, consumer_name)}`, { durable: true }))
        .concat([
            channel.assertQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-1-30s`, { durable: true, deadLetterExchange: `${exchangeName(exchange_name, namespace, consumer_name)}-dlx`, messageTtl: 30000 }),
            channel.assertQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-2-10m`, { durable: true, deadLetterExchange: `${exchangeName(exchange_name, namespace, consumer_name)}-dlx`, messageTtl: 600000 }),
            channel.assertQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-3-48h`, { durable: true, deadLetterExchange: `${exchangeName(exchange_name, namespace, consumer_name)}-dlx`, messageTtl: 195840000 }),
            channel.assertQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-4-dead`, { durable: true }),
        ])
    );
}
function bindExchangesToQueues(channel, exchange_name, namespace, consumer_name) {
    return Promise.all([]
        .concat(
            channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}`, `${exchange_name}`),
            //channel.bindQueue('comments', 'A_COMMENT_DELETED'),
            //channel.bindQueue('comments', 'A_COMMENT_UPDATED')
        )
        .concat(channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}`, `${exchangeName(exchange_name, namespace, consumer_name)}-dlx`))
        .concat(
            channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-1-30s`, `${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, 'retry-1'),
            channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-2-10m`, `${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, 'retry-2'),
            channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-3-48h`, `${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, 'retry-3'),
            channel.bindQueue(`${queueName(exchange_name, namespace, consumer_name)}-retry-4-dead`, `${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, 'retry-4')
        )
    );
}

function sendMsgToRetry(channel, msg, exchange_name, namespace, consumer_name, app_id, err) {

    // ack original msg
    channel.ack(msg);

    // Unpack content, update and pack it back
    function getAttemptAndUpdatedContent(msg) {
        let content = JSON.parse(msg.content);
        content.try_attempt_timestamp = new Date().toISOString();
        if (err) {
            content.try_attempt_error = err.toString();
        } else {
            content.try_attempt_error = null;
        }
        content.try_attempt = ++content.try_attempt || 1;
        const attempt = content.try_attempt;
        content = Buffer.from(JSON.stringify(content));
        return { attempt, content };
    }
    const { attempt, content } = getAttemptAndUpdatedContent(msg);

    if (attempt <= 3) {
        const routing_key = `retry-${attempt}`;
        const options = {
            persistent: true,
            appId: app_id
        };
        Object.keys(msg.properties).forEach(key => {
            options[key] = msg.properties[key];
        });
        return channel.publish(`${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, routing_key, content, options);
    } else {
        const routing_key = `retry-4`;
        const options = {
            persistent: true,
            appId: app_id
        };
        Object.keys(msg.properties).forEach(key => {
            options[key] = msg.properties[key];
        });
        return channel.publish(`${exchangeName(exchange_name, namespace, consumer_name)}-ttl`, routing_key, content, options);
    }
}

// https://blog.forma-pro.com/rabbitmq-retries-on-node-js-1f82c6afc1a1
Bus.prototype.onRetry = function (exchange_name, consumer_name, consumer) {
    let self = this;
    let namespace = self.config.namespace;
    let _ch = null;

    return self.connection.then(conn => {
        return conn.createChannel();
    }).then(ch => {
        _ch = ch;
        return Promise.resolve();
    }).then(() => {
        return assertExchanges(_ch, exchange_name, namespace, consumer_name)
    }).then(() => {
        return assertQueues(_ch, exchange_name, namespace, consumer_name)
    }).then(() => {
        return bindExchangesToQueues(_ch, exchange_name, namespace, consumer_name)
    }).then(() => {
        function handler(msg) {
            return (new Promise((resolve, reject) => {
                consumer(JSON.parse(msg.content), function (err) {
                    if (err) {
                        return reject(err)
                    } else {
                        return resolve()
                    }
                });
            }))
        }
        _ch.prefetch(1);
        _ch.consume(`${queueName(exchange_name, namespace, consumer_name)}`, msg => {
            return (new Promise((resolve, reject) => {
                if (msg.fields.redelivered) {
                    return reject('Message was redelivered, so something wrong happened');
                }
                handler(msg).then(resolve).catch(reject);
            }))
                .then(() => {
                    _ch.ack(msg);
                })
                .catch(err => {
                    handleRejectedMsg(err)
                });
            function handleRejectedMsg(err) {
                let app_id = self.config.app;
                return sendMsgToRetry(_ch, msg, exchange_name, namespace, consumer_name, app_id, err);
            }
        });
    });
};

// ---

Bus.prototype.publish = function (exchange_name, data) {
    var self = this;
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertExchange(exchange_name, 'direct', {
                durable: false,
                autoDelete: true
            });
            ok = ok.then(function () {
                return ch.publish(exchange_name, '', Buffer.from(JSON.stringify(data)), {
                    persistent: true,
                    appId: self.config.app
                });
            });
            return ok.then(function () {
                return ch.close();
            });
        });
    })
};

Bus.prototype.subscribe = function (exchange_name, consumer) {
    var self = this;
    var queue_name = [
        exchange_name,
        uuid.v4()
    ].join('-');
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertExchange(exchange_name, 'direct', {
                durable: false,
                autoDelete: true
            });
            ok = ok.then(function () {
                return ch.assertQueue(queue_name, {
                    exclusive: true
                });
            });
            ok = ok.then(function (qok) {
                return ch.bindQueue(qok.queue, exchange_name, '').then(function () {
                    return qok.queue;
                });
            });
            ok = ok.then(function (queue) {
                ch.prefetch(1);
                return ch.consume(queue, processMessage, {
                    noAck: false
                });
            });
            return ok.then(function () {
                console.log('[RabbitMQ] Waiting for messages delivered to queue (subscribe): ' + queue_name);
            });
            function processMessage(msg) {
                if (consumer) {
                    consumer(JSON.parse(msg.content), function (err) {
                        if (err)
                            ch.reject(msg, true);
                        ch.ack(msg);
                    });
                } else {
                    throw new Error();
                }
            }
        });
    });
};

// ---

Bus.prototype.request = function (queue_name, data) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var correlationId = uuid.v4();
        return self.connection.then(function (conn) {
            return conn.createChannel().then(function (ch) {
                var ok = ch.assertQueue('', {
                    exclusive: true,
                    autoDelete: true
                }).then(function (qok) {
                    return qok.queue;
                });
                ok = ok.then(function (queue) {
                    return ch.consume(queue, function maybeAnswer(msg) {
                        if (msg.properties.correlationId === correlationId) {
                            var answer = JSON.parse(msg.content);
                            debug('request answer', answer);
                            ch.close();
                            if (answer.error) {
                                debug('request error', answer.error);
                                var app = msg.properties.appId;
                                var method = queue_name;
                                var inner_error = new Error();
                                inner_error.name = answer.error.name;
                                inner_error.message = answer.error.message;
                                inner_error.code = answer.error.code;
                                var error = new BusError(app, method, inner_error);
                                return reject(error);
                            } else {
                                return resolve(answer.data);
                            }
                        }
                    }, {
                        noAck: true
                    }).then(function () {
                        return queue;
                    });
                });
                ok = ok.then(function (queue) {
                    ch.sendToQueue(queue_name, Buffer.from(JSON.stringify(data)), {
                        correlationId: correlationId,
                        replyTo: queue,
                        appId: self.config.app
                    });
                });
                return ok.then(function () {
                    debug('request' + queue_name);
                });
            })
        })
    });
};

Bus.prototype.reply = function (queue_name, consumer) {
    var self = this;
    return new Promise(function (resolve, reject) {
        return self.connection.then(function (conn) {
            return conn.createChannel().then(function (ch) {
                var ok = ch.assertQueue(queue_name, {
                    durable: true
                });
                ok = ok.then(function () {
                    ch.prefetch(1);
                    return ch.consume(queue_name, processMessage);
                });
                return ok.then(function () {
                    console.log('[RabbitMQ] Awaiting RPC requests on: ' + queue_name);
                    return resolve();
                });
                function processMessage(msg) {
                    var content = JSON.parse(msg.content);
                    consumer(content, function (err, data) {
                        var error = null;
                        if (err) {
                            error = {
                                name: err.name,
                                message: err.message,
                                code: err.code
                            };
                            debug('reply error', error);
                        }
                        ch.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({
                            error: error,
                            data: data
                        })), {
                            correlationId: msg.properties.correlationId,
                            appId: self.config.app
                        });
                        ch.ack(msg);
                    });
                }
            })
        })
    })
};

// ---

Bus.prototype.task = function (queue_name, data) {
    var self = this;
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertQueue(queue_name, {
                durable: true
            });
            ok = ok.then(function () {
                debug("task" + queue_name);
                return ch.sendToQueue(queue_name, Buffer.from(JSON.stringify(data)), {
                    persistent: true,
                    appId: self.config.app
                });
            });
            return ok.then(function () {
                return ch.close();
            });
        })
    })
};

Bus.prototype.worker = function (queue_name, consumer) {
    var self = this;
    return self.connection.then(function (conn) {
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertQueue(queue_name, {
                durable: true
            });
            ok = ok.then(function () {
                ch.prefetch(1);
            });
            return ok.then(function () {
                console.log('[RabbitMQ] Awaiting tasks on: ' + queue_name);
                return ch.consume(queue_name, processMessage, {
                    noAck: false
                });
            });
            function processMessage(msg) {
                if (consumer) {
                    consumer(JSON.parse(msg.content), function (err) {
                        if (err)
                            ch.reject(msg, true);
                        ch.ack(msg);
                    });
                } else {
                    throw new Error();
                }
            }
        })
    })
};

// ---

Bus.prototype.push = function (queue_name, consumer) {
    var self = this;
    return new Promise(function (resolve, reject) {
        return self.connection.then(function (conn) {
        })
    })
};

Bus.prototype.pull = function (queue_name, consumer) {
    var self = this;
    return new Promise(function (resolve, reject) {
        return self.connection.then(function (conn) {
        })
    })
};

// ---

Bus.prototype.close = async function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        return self.connection.then(function (conn) {
            return conn.close();
        })
    })
};

// ---

exports.Bus = Bus;