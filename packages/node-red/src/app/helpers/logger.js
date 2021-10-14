const winston = require('winston');
const { format, transports } = require('winston');
const { timestamp, colorize, printf, errors } = format;
const { Console } = transports;

winston.configure({
    level: process.env.LOGGER_LEVEL || 'debug',
    format: format.combine(
        errors({ stack: true }),
        timestamp(),
        colorize(),
        printf(({ level, message, timestamp, stack }) => {
            if (stack) {
                return `${timestamp} ${level}: ${message} - ${stack}`;
            }
            return `${timestamp} ${level}: ${message}`;
        }),
    ),
    transports: [
        new Console()
    ],
});

winston.loggers.add('server', {
    level: process.env.LOGGER_LEVEL || 'debug',
    format: format.combine(
        errors({ stack: true }),
        timestamp(),
        colorize(),
        printf(({ level, message, timestamp, stack }) => {
            if (stack) {
                return `${timestamp} ${level}: ${message} - ${stack}`;
            }
            return `${timestamp} ${level}: ${message}`;
        }),
    ),
    transports: [
        new Console()
    ],
});

winston.loggers.add('storage', {
    level: process.env.LOGGER_LEVEL || 'debug',
    format: format.combine(
        errors({ stack: true }),
        timestamp(),
        colorize(),
        printf(({ level, message, timestamp, stack }) => {
            if (stack) {
                return `${timestamp} ${level}: ${message} - ${stack}`;
            }
            return `${timestamp} ${level}: ${message}`;
        }),
    ),
    transports: [
        new Console()
    ],
});

winston.loggers.add('context', {
    level: process.env.LOGGER_LEVEL || 'debug',
    format: format.combine(
        errors({ stack: true }),
        timestamp(),
        colorize(),
        printf(({ level, message, timestamp, stack }) => {
            if (stack) {
                return `${timestamp} ${level}: ${message} - ${stack}`;
            }
            return `${timestamp} ${level}: ${message}`;
        }),
    ),
    transports: [
        new Console()
    ],
});