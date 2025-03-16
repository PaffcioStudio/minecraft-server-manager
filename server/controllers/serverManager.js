const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { log } = require('../utils/logger');
const { createDefaultInstance } = require('../utils/helpers');

const servers = {};
let wss;

function setWss(webSocketServer) {
    wss = webSocketServer;
}

async function initServers() {
    log('server', 'info', '[SERVERS_INIT] Inicjalizacja listy serwerów...');
    const serversDir = path.join(__dirname, '../servers');
    await fs.mkdir(serversDir, { recursive: true }).catch(() => log('server', 'info', '[SERVERS_DIR] Katalog servers już istnieje'));

    const dirs = await fs.readdir(serversDir).catch((e) => {
        log('error', 'error', '[SERVERS_READ_ERROR] Błąd odczytu katalogu servers', e);
        return [];
    });

    for (const dir of dirs) {
        const instancePath = path.join(serversDir, dir, 'instance.json');
        try {
            const stats = await fs.stat(path.join(serversDir, dir));
            if (!stats.isDirectory()) continue;

            let instance;
            try {
                const instanceData = await fs.readFile(instancePath, 'utf8');
                instance = JSON.parse(instanceData);
            } catch (e) {
                log('server', 'warn', `[SERVERS_LOAD_WARN] Brak instance.json dla ${dir}, tworzenie domyślnego`);
                instance = createDefaultInstance(dir);
                await fs.writeFile(instancePath, JSON.stringify(instance, null, 2));
            }

            servers[dir] = { 
                ...instance, 
                process: null, 
                running: false,
                mcVersion: instance.mcVersion || instance.version || null
            };
            // Usunięto: console.log(`[DEBUG] Wczytano instance dla ${dir}:`, instance);
            // Usunięto: console.log(`[DEBUG] Ustawiono servers[${dir}]:`, servers[dir]);
            await loadServerFiles(dir);
            log('server', 'info', `[SERVERS_LOADED] Wczytano serwer: ${dir}`);
        } catch (e) {
            log('error', 'error', `[SERVERS_LOAD_ERROR] Błąd przetwarzania serwera ${dir}`, e);
        }
    }
}

async function addServer(name) {
    log('server', 'info', `[SERVER_ADD] Dodawanie serwera: ${name}`);
    const dir = path.join(__dirname, '../servers', name);
    await fs.mkdir(dir, { recursive: true }).catch(() => log('server', 'info', `[SERVER_DIR] Katalog ${name} już istnieje`));
    const instance = createDefaultInstance(name);
    servers[name] = { 
        ...instance, 
        process: null, 
        running: false, 
        mcVersion: null
    };
    await saveInstance(name);
    broadcastServers();
}

async function loadServerFiles(serverName) {
    const server = servers[serverName];
    server.files = server.files || {};
    const files = ['banned-ips.json', 'banned-players.json', 'ops.json', 'whitelist.json'];
    for (const file of files) {
        try {
            server.files[file] = await fs.readFile(path.join(server.dir, file), 'utf8');
        } catch {
            server.files[file] = '[]';
            await fs.writeFile(path.join(server.dir, file), '[]');
        }
    }
    try {
        await fs.access(path.join(server.dir, 'mods'));
        server.hasMods = true;
        server.mods = await fs.readdir(path.join(server.dir, 'mods')).catch(() => []);
    } catch {
        server.hasMods = false;
        server.mods = [];
        await fs.mkdir(path.join(server.dir, 'mods'), { recursive: true });
    }
}

async function startServer(serverName, ws) {
    const server = servers[serverName];
    if (!server.jar) {
        log('error', 'error', `[SERVER_START_ERROR] Brak pliku JAR dla ${serverName}`);
        return;
    }
    if (server.running) {
        log('error', 'error', `[SERVER_START_ERROR] Serwer ${serverName} już działa`);
        return;
    }
    const javaPath = `"${server.javaPath || 'java'}"`;
    const jarPath = `"${path.join(server.dir, server.jar)}"`;
    const args = [`-Xmx${server.ram}G`, ...(server.javaParams ? server.javaParams.split(' ') : []), '-jar', jarPath, 'nogui'];
    log('minecraft', 'info', `[SERVER_RUNNING] Uruchamianie serwera ${serverName} z Java: ${javaPath}, args: ${args.join(' ')}`);

    try {
        await fs.access(path.join(server.dir, server.jar));
    } catch (e) {
        log('error', 'error', `[SERVER_START_ERROR] Kurwa, nie ma dostępu do ${jarPath}!`, e);
        return;
    }

    const proc = spawn(javaPath, args, { cwd: server.dir, shell: true });
    server.process = proc;
    server.running = true;
    server.crashed = false;

    proc.stdout.on('data', (data) => ws.send(JSON.stringify({ type: 'console', serverName, output: data.toString() })));
    proc.stderr.on('data', (data) => {
        const error = data.toString();
        log('error', 'error', `[SERVER_ERROR] Błąd Javy dla ${serverName}: ${error}`);
        ws.send(JSON.stringify({ type: 'console', serverName, output: error }));
    });
    proc.on('close', (code) => {
        server.running = false;
        server.crashed = code !== 0;
        log('minecraft', 'info', `[SERVER_STOPPED] Serwer ${serverName} zatrzymany z kodem ${code}`);
        broadcastServers();
    });

    await saveInstance(serverName);
    broadcastServers();
}

function stopServer(serverName) {
    const server = servers[serverName];
    if (!server.running || !server.process) return;
    server.process.stdin.write('stop\n');
    server.running = false;
}

async function restartServer(serverName, ws) {
    stopServer(serverName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await startServer(serverName, ws);
}

function killServer(serverName) {
    const server = servers[serverName];
    if (!server.running || !server.process) return;
    server.process.kill('SIGKILL');
    server.running = false;
}

async function saveInstance(serverName) {
    const instance = { ...servers[serverName], process: null };
    await fs.writeFile(path.join(servers[serverName].dir, 'instance.json'), JSON.stringify(instance, null, 2));
    log('minecraft', 'info', `[INSTANCE_SAVED] Zaktualizowano instance.json dla ${serverName}`);
}

function broadcastServers() {
    if (!wss) {
        log('error', 'error', '[SERVERS_BROADCAST_ERROR] WebSocket Server nie zainicjalizowany!');
        return;
    }
    // Usunięto: console.log('[DEBUG] Wysyłane serwery do klientów:', servers);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'servers', servers }));
        }
    });
    log('server', 'info', '[SERVERS_BROADCAST] Rozsyłanie stanu serwerów do klientów');
}

module.exports = {
    servers,
    setWss,
    initServers,
    addServer,
    loadServerFiles,
    startServer,
    stopServer,
    restartServer,
    killServer,
    saveInstance,
    broadcastServers
};