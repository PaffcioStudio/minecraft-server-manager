const { log } = require('../utils/logger');
const { servers, startServer, stopServer, restartServer, killServer, saveInstance, addServer } = require('./serverManager');
const { uploadJar, uploadIcon, getIcon, getFiles, renameFile, deleteFile } = require('./fileManager');
const { javaVersions, scanJavaVersions } = require('./javaManager');
const fs = require('fs').promises;
const path = require('path');

// Prosty debounce dla requestów
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

function handleWebSocket(ws) {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        log('server', 'info', `[CLIENT_ACTION] Żądanie klienta: ${data.type}`);

        switch (data.type) {
            case 'getServers':
                ws.send(JSON.stringify({ type: 'servers', servers }));
                const currentJavaVersions = await scanJavaVersions();
                ws.send(JSON.stringify({ type: 'javaVersions', versions: currentJavaVersions }));
                break;
            case 'addServer':
                await addServer(data.name);
                break;
            case 'deleteServer':
                if (servers[data.serverName] && !servers[data.serverName].running) {
                    await fs.rm(path.join(__dirname, '../servers', data.serverName), { recursive: true, force: true });
                    delete servers[data.serverName];
                    log('server', 'info', `[SERVER_DELETE] Usunięto serwer: ${data.serverName}`);
                    require('./serverManager').broadcastServers();
                } else {
                    log('error', 'error', `[SERVER_DELETE_ERROR] Serwer ${data.serverName} działa lub nie istnieje`);
                }
                break;
            case 'startServer':
                await startServer(data.serverName, ws);
                break;
            case 'stopServer':
                stopServer(data.serverName);
                break;
            case 'restartServer':
                await restartServer(data.serverName, ws);
                break;
            case 'killServer':
                killServer(data.serverName);
                await saveInstance(data.serverName);
                break;
            case 'uploadJar':
                await uploadJar(data.serverName, data.data, data.filename);
                await saveInstance(data.serverName);
                break;
            case 'uploadIcon':
                await uploadIcon(data.serverName, data.data);
                ws.send(JSON.stringify({ type: 'icon', serverName: data.serverName, data: data.data }));
                break;
            case 'getIcon':
                const iconData = await getIcon(data.serverName);
                if (iconData) ws.send(JSON.stringify({ type: 'icon', serverName: data.serverName, data: iconData }));
                break;
            case 'getFiles':
                const files = await getFiles(data.serverName, data.path);
                ws.send(JSON.stringify({ type: 'fileList', path: data.path, files }));
                break;
            case 'renameFile':
                await renameFile(data.serverName, data.path, data.newName);
                break;
            case 'deleteFile':
                await deleteFile(data.serverName, data.path);
                break;
            case 'getLog':
                const logPath = path.join(__dirname, '../servers', data.serverName, 'logs', data.logFile);
                try {
                    const logContent = await fs.readFile(logPath, 'utf8');
                    ws.send(JSON.stringify({ type: 'logContent', serverName: data.serverName, logContent }));
                } catch (e) {
                    log('error', 'error', `[LOG_ERROR] Nie można wczytać logu ${data.logFile}: ${e}`);
                    ws.send(JSON.stringify({ type: 'logContent', serverName: data.serverName, logContent: 'Brak logów, kurwa!' }));
                }
                break;
            case 'setJava':
                debounce(async () => {
                    if (servers[data.serverName] && !servers[data.serverName].running) {
                        if (servers[data.serverName].javaPath !== data.version) {
                            servers[data.serverName].javaPath = data.version;
                            await saveInstance(data.serverName);
                            log('server', 'info', `[SET_JAVA] Ustawiono Java ${data.version} dla ${data.serverName}`);
                        }
                        require('./serverManager').broadcastServers();
                    } else {
                        log('error', 'error', `[SET_JAVA_ERROR] Serwer ${data.serverName} działa lub nie istnieje`);
                    }
                }, 500)();
                break;
            case 'setRam':
                debounce(async () => {
                    if (servers[data.serverName] && !servers[data.serverName].running) {
                        const newRam = parseInt(data.ram, 10);
                        if (servers[data.serverName].ram !== newRam) {
                            servers[data.serverName].ram = newRam;
                            await saveInstance(data.serverName);
                            log('server', 'info', `[SET_RAM] Ustawiono RAM ${newRam}G dla ${data.serverName}`);
                        }
                        require('./serverManager').broadcastServers();
                    } else {
                        log('error', 'error', `[SET_RAM_ERROR] Serwer ${data.serverName} działa lub nie istnieje`);
                    }
                }, 500)();
                break;
            case 'setJavaParams':
                debounce(async () => {
                    if (servers[data.serverName] && !servers[data.serverName].running) {
                        if (servers[data.serverName].javaParams !== data.params) {
                            servers[data.serverName].javaParams = data.params;
                            await saveInstance(data.serverName);
                            log('server', 'info', `[SET_PARAMS] Ustawiono parametry Javy ${data.params} dla ${data.serverName}`);
                        }
                        require('./serverManager').broadcastServers();
                    } else {
                        log('error', 'error', `[SET_PARAMS_ERROR] Serwer ${data.serverName} działa lub nie istnieje`);
                    }
                }, 500)();
                break;
            case 'setMcVersion':
                debounce(async () => {
                    if (servers[data.serverName]) {
                        if (servers[data.serverName].mcVersion !== data.version) {
                            servers[data.serverName].mcVersion = data.version;
                            await saveInstance(data.serverName);
                            log('server', 'info', `[SET_MC_VERSION] Ustawiono wersję MC ${data.version} dla ${data.serverName}`);
                        }
                        require('./serverManager').broadcastServers();
                    } else {
                        log('error', 'error', `[SET_MC_VERSION_ERROR] Serwer ${data.serverName} nie istnieje`);
                    }
                }, 500)();
                break;
            default:
                log('server', 'warn', `[CLIENT_ACTION] Nieznane żądanie klienta: ${data.type}`);
        }
    });
}

module.exports = { handleWebSocket };