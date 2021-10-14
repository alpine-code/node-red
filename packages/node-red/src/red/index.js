var express = require('express');
var router = express.Router();

const logger = require('winston').loggers.get('server');

var settings = {
    httpAdminRoot: "/builder/",
    httpNodeRoot: "/api/",
    flowFile: 'flows.json',
    userDir: "./data",
    credentialSecret: 'secret',
    functionGlobalContext: {},
    contextStorage: {
        default: {
            module: 'memory'
        },
        // shared: {
        //     module: require("./context/redis"),
        //     config: {
        //         url: process.env.REDIS_URL,
        //         prefix: process.env.REDIS_PREFIX,
        //         tls: true
        //     }
        // }
    },
    // storageModule: require("./storage/minio"),
    // storageModuleSettings: {
    //     endpoint: process.env.MINIO_ENDPOINT,
    //     bucket: process.env.MINIO_BUCKET,
    //     accessKey: process.env.MINIO_ACCESS_KEY,
    //     secretKey: process.env.MINIO_SECRET_KEY,
    //     prefix: process.env.MINIO_PREFIX
    // },
    logging: {
        console: {
            // Level of logging to be recorded. Options are:
            // fatal - only those errors which make the application unusable should be recorded
            // error - record errors which are deemed fatal for a particular request + fatal errors
            // warn - record problems which are non fatal + errors + fatal errors
            // info - record information about the general running of the application + warn + error + fatal errors
            // debug - record information which is more verbose than info + info + warn + error + fatal errors
            // trace - record very detailed logging + debug + info + warn + error + fatal errors
            // off - turn off all logging (doesn't affect metrics or audit)
            level: "info",
            metrics: false,
            audit: false
        }
    },
    swagger: {
        template: {
            swagger: "2.0",
            info: {
                title: "Builder",
                version: "0.0.1"
            }
        }
    },
    editorTheme: {
        page: {
            title: "Builder",
            favicon: __dirname + "/assets/logo.svg",
            css: [
                __dirname + "/assets/camphor.css",
                __dirname + "/assets/style.css"
            ],
            scripts: [
                __dirname + "/assets/script.js"
            ]
        },
        header: {
            title: " ",
            image: __dirname + "/assets/logo.svg",
            url: "https://www.the-lab.io"
        },
        deployButton: {
            type: "simple",
            label: "Deploy",
            icon: __dirname + "/assets/deploy-full-o.svg",
        },
        menu: {
            "menu-item-import-library": process.env.NODE_RED_IMPORT_EXPORT === 'yes',
            "menu-item-export-library": process.env.NODE_RED_IMPORT_EXPORT === 'yes',
            "menu-item-keyboard-shortcuts": false,
            "menu-item-help": {
                label: "The Lab",
                url: "https://www.the-lab.io"
            }
        },
        userMenu: false,
        login: {
            image: __dirname + "/assets/logo.svg",
        },
        logout: {
            redirect: "https://www.the-lab.io"
        },
        palette: {
            allowInstall: process.env.NODE_RED_EDITOR_PALETTE === 'yes',
            catalogues: [
                'https://catalogue.nodered.org/catalogue.json'
            ],
            theme: [
                { category: "common", type: "complete|catch|status|link in|link out", color: "rgb(233, 233, 235)" },
                { category: "common", type: "inject", color: "#909399" },
                { category: "common", type: "debug", color: "#909399" },
                { category: "function", type: ".*", color: "rgb(253, 226, 226)" },
                { category: "network", type: ".*", color: "rgb(250, 236, 216)" },
                { category: "sequence", type: ".*", color: "rgb(225, 243, 216)" },
                { category: "parser", type: ".*", color: "rgb(217, 236, 255)" },
                { category: "storage", type: ".*", color: "rgb(217, 236, 255)" },
                { category: "dashboard", type: ".*", color: "rgb(233, 233, 235)" },
            ]
        },
        projects: {
            enabled: false,
        },
    },
    ui: {
        path: 'dashboard', middleware: function (req, res, next) {
            next()
        }
    }
};

var RED = require("node-red");

RED.events.on('runtime-event', async (event) => {
    logger.debug(event.id)
})

var secured = require('../app/middleware/secured');
//router.use(secured());

module.exports = {
    router,
    start: function (server) {
        RED.init(server, settings);
        router.use(settings.httpAdminRoot, RED.httpAdmin);
        router.use(settings.httpNodeRoot, RED.httpNode);
        RED.start();
    }
};