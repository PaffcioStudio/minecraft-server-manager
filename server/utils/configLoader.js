const fs = require('fs').promises;
const path = require('path');
const { log } = require('./logger');

async function loadConfig() {
    const configPath = path.join(__dirname, '../config.json');
    try {
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        log('warn', '[CONFIG_LOAD] Brak config.json, używam domyślnych ustawień');
        return { javaToDownload: ['8', '11', '16', '17', '20'] };
    }
}

module.exports = { loadConfig };