const path = require('path');
const { javaVersions } = require('../controllers/javaManager');

function createDefaultInstance(name) {
    const defaultJava = javaVersions[0] || { version: 'java-17', path: 'java' };
    return {
        name,
        dir: path.join(__dirname, '../servers', name),
        jar: null,
        java: defaultJava.version,
        javaPath: defaultJava.path,
        ram: 4,
        version: null,
        process: null,
        running: false,
        properties: {
            'motd': 'Serwer MC',
            'difficulty': 'normal',
            'pvp': 'false',
            'max-players': '20',
            'online-mode': 'true'
        },
        files: {
            'banned-ips.json': '[]',
            'banned-players.json': '[]',
            'ops.json': '[]',
            'whitelist.json': '[]'
        },
        hasMods: false,
        mods: []
    };
}

module.exports = { createDefaultInstance };