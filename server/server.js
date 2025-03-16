const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { initJava } = require('./controllers/javaManager');
const { initServers, broadcastServers, setWss } = require('./controllers/serverManager');
const { handleWebSocket } = require('./controllers/wsHandler');
const { loadConfig } = require('./utils/configLoader');
const { log } = require('./utils/logger');
const os = require('os');

const app = express();

// Serwowanie statycznych plików z folderu public
app.use(express.static(path.join(__dirname, '../public')));

// Pobieramy lokalne IP
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
};

const PORT = 8080;
const IP = getLocalIP();
const server = app.listen(PORT, () => {
    console.log(`Serwer uruchomiony na ${IP}:${PORT}`);
    log('server', 'info', `[START] Serwer uruchomiony na ${IP}:${PORT}`);
});

const wss = new WebSocket.Server({ server });

async function init() {
    try {
        const config = await loadConfig();
        await Promise.all([initJava(config), initServers()]);
        setWss(wss);
        log('server', 'info', '[INIT_COMPLETE] Inicjalizacja zakończona, serwer gotowy');
        broadcastServers();
    } catch (e) {
        log('error', 'error', '[INIT_ERROR] Błąd inicjalizacji', e);
    }
}

wss.on('connection', (ws) => {
    log('server', 'info', '[CLIENT_CONNECT] Klient podłączony do panelu');
    handleWebSocket(ws);
    ws.on('close', () => log('server', 'info', '[CLIENT_DISCONNECT] Klient rozłączony'));
});

// Odpalamy init po załadowaniu loggera
init();

module.exports = { wss };