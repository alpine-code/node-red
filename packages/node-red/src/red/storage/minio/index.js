const logger = require('winston').loggers.get('storage');
const _ = require("lodash");
var Minio = require('minio')

let client = null;
let BUCKET = null;
let UID = null;

function streamToString(stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

function streamToArray(stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(chunks))
    })
}

function stringify(data) {
    return JSON.stringify(data);
}
function parse(data) {
    return JSON.parse(data);
}

export async function init(settings, runtime) {
    UID = settings.storageModuleSettings.prefix;
    BUCKET = settings.storageModuleSettings.bucket;
    client = new Minio.Client({
        endPoint: settings.storageModuleSettings.endpoint,
        accessKey: settings.storageModuleSettings.accessKey,
        secretKey: settings.storageModuleSettings.secretKey
    });
    logger.debug(`${BUCKET} ${UID}`)
    return await Promise.resolve();
}

export async function getFlows() {
    try {
        return parse(await streamToString(await client.getObject(BUCKET, `${UID}/flows.json`)));
    } catch (err) {
        return [];
    }
}

export async function saveFlows(flows) {
    const result = await client.putObject(BUCKET, `${UID}/flows.json`, stringify(flows), 'application/json');
}

export async function getCredentials() {
    try {
        return parse(await streamToString(await client.getObject(BUCKET, `${UID}/credentials.json`)));
    } catch (err) {
        return [];
    }
}

export async function saveCredentials(credentials) {
    const result = await client.putObject(BUCKET, `${UID}/credentials.json`, stringify(credentials), 'application/json');
}

export async function getSettings() {
    try {
        return parse(await streamToString(await client.getObject(BUCKET, `${UID}/settings.json`)));
    } catch (err) {
        return {};
    }
}

export async function saveSettings(settings) {
    const result = await client.putObject(BUCKET, `${UID}/settings.json`, stringify(settings), 'application/json');
}

export async function getSessions() {
    try {
        return parse(await streamToString(await client.getObject(BUCKET, `${UID}/sessions.json`)));
    } catch (err) {
        return {};
    }
}

export async function saveSessions(sessions) {
    const result = await client.putObject(BUCKET, `${UID}/sessions.json`, stringify(sessions), 'application/json');
}

export async function getLibraryEntry(type, name) {
    let path = `${UID}/lib/${type}/${name}`;
    if (name) {
        if (name.substr(-1) === '/') {
            try {
                const items = await streamToArray(await client.listObjects(BUCKET, path, false));
                let output = await Promise.all(_.map(items, async item => {
                    if(item.name) {
                        let file = await client.statObject(BUCKET, item.name);
                        let filename = file.metaData.filename;
                        let metadata = parse(file.metaData.metadata);
                        return {
                            fn: filename,
                            ...metadata
                        } 
                    } else {
                        let folder = _.reverse(item.prefix.split('/'))[1]
                        return folder
                    }
                }))
                return output;
            } catch (err) {
                throw err;
            }
        } else {
            try {
                return streamToString(await client.getObject(BUCKET, path));
            } catch (err) {
                throw err;
            }
        }
    } else {
        try {
            const items = await streamToArray(await client.listObjects(BUCKET, path, false));
            let output = await Promise.all(_.map(items, async item => {
                if(item.name) {
                    let file = await client.statObject(BUCKET, item.name);
                    let filename = file.metaData.filename;
                    let metadata = parse(file.metaData.metadata);
                    return {
                        fn: filename,
                        ...metadata
                    } 
                } else {
                    let folder = _.reverse(item.prefix.split('/'))[1]
                    return folder
                }
            }))
            return output;
        } catch (err) {
            throw err;
        }
    }
}
export async function saveLibraryEntry(type, name, meta, body) {
    let path = `${UID}/lib/${type}/${name}`;
    let filename = _.last(name.split('/'));
    let metadata = stringify(meta);
    const result = await client.putObject(BUCKET, path, body, null, {
        filename: filename,
        metadata: metadata
    });
}