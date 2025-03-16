import { sendMessage, sendDebouncedMessage, servers, setCurrentServer, setUpdateCallbacks, currentServer, consoleLines, MAX_LINES } from './websocket.js';
import { updateMods } from './mods.js';

// Definiujemy updateServersList na poziomie modułu
export function updateServersList() {
    const list = document.getElementById('serversList');
    list.innerHTML = '';
    Object.keys(servers).forEach(name => {
        const div = document.createElement('div');
        div.className = `server-item ${currentServer === name ? 'active' : ''}`;
        const dot = document.createElement('span');
        dot.className = `status-dot ${servers[name].running ? 'green' : servers[name].crashed ? 'yellow' : 'red'}`;
        div.appendChild(dot);
        // Dodajemy mcVersion do nazwy, jeśli istnieje
        const versionText = servers[name].mcVersion ? ` (MC ${servers[name].mcVersion})` : '';
        div.appendChild(document.createTextNode(`${name}${versionText}`));
        div.addEventListener('click', () => selectServer(name));
        div.addEventListener('contextmenu', (e) => showServerContext(e));
        list.appendChild(div);
    });
    console.log('Lista serwerów zaktualizowana, kurwa git! 😎');
}

// Definiujemy updateServerView na poziomie modułu
export function updateServerView(name) {
    // Wyświetlamy nazwę serwera z wersją MC, jeśli istnieje
    document.getElementById('currentServer').textContent = servers[name].mcVersion ? `${name} (MC ${servers[name].mcVersion})` : name;
    document.getElementById('serverNameEdit').value = name;
    const isRunning = servers[name].running;
    document.getElementById('startBtn').disabled = isRunning;
    document.getElementById('stopBtn').disabled = !isRunning;
    document.getElementById('restartBtn').disabled = !isRunning;
    document.getElementById('killBtn').disabled = !isRunning;
    document.getElementById('deleteBtn').disabled = isRunning;
    document.getElementById('serverNameEdit').disabled = isRunning;
    document.getElementById('iconUpload').disabled = isRunning;
    document.getElementById('modsTab').style.display = servers[name].hasMods ? 'block' : 'none';
    updateProperties(servers[name].properties);
    updatePlayersManagement('bannedPlayers', 'banned-players.json', ['Nick', 'Powód', 'Usuń'], 'name');
    updatePlayersManagement('bannedIps', 'banned-ips.json', ['IP', 'Powód', 'Usuń'], 'ip');
    updatePlayersManagement('whitelist', 'whitelist.json', ['Nick', 'Usuń'], 'name');
    updatePlayersManagement('ops', 'ops.json', ['Nick', 'Poziom', 'Usuń'], 'name');
    updateMods(name);
    updateConsole(name);
}

export function initServers() {
    document.getElementById('addServerBtn').addEventListener('click', addServer);
    document.getElementById('startBtn').addEventListener('click', startServer);
    document.getElementById('stopBtn').addEventListener('click', stopServer);
    document.getElementById('restartBtn').addEventListener('click', restartServer);
    document.getElementById('killBtn').addEventListener('click', killServer);
    document.getElementById('deleteBtn').addEventListener('click', deleteServer);
    document.getElementById('sendCommandBtn').addEventListener('click', sendCommand);
    document.getElementById('clearConsoleBtn').addEventListener('click', clearConsole);
    document.getElementById('consoleInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCommand();
    });

    setUpdateCallbacks({
        updateServersList,
        updateServerView,
        appendConsole: (serverName, output) => {
            if (!consoleLines.has(serverName)) consoleLines.set(serverName, []);
            const lines = consoleLines.get(serverName);
            lines.push(output);
            if (lines.length > MAX_LINES) lines.shift();
            if (serverName === currentServer) updateConsole(serverName);
        },
        detectServerVersion: (serverName, output) => {
            const match = output.match(/Starting minecraft server version (.+)/);
            if (match && currentServer === serverName) {
                const mcVersion = match[1];
                sendMessage({ type: 'setMcVersion', serverName, version: mcVersion });
                console.log(`Wykryto wersję MC ${mcVersion} dla ${serverName}, kurwa spoko! 😂`);
            }
        }
    });
}

function addServer() {
    const name = document.getElementById('serverName').value;
    if (name) {
        sendMessage({ type: 'addServer', name });
        document.getElementById('serverName').value = '';
    }
}

function selectServer(name) {
    setCurrentServer(name);
    updateServersList();
    updateServerView(name);
    document.getElementById('serverContent').style.display = 'block';
    if (document.querySelector('.tab.active').dataset.tab === 'files') {
        sendMessage({ type: 'getFiles', serverName: name, path: '' });
    }
    sendMessage({ type: 'getIcon', serverName: name });
    loadConsoleFromLog(name);
}

function startServer() {
    if (currentServer) sendMessage({ type: 'startServer', serverName: currentServer });
    console.log(`Startuję ${currentServer}, niech się dzieje! 🔥`);
}

function stopServer() {
    if (currentServer) sendMessage({ type: 'stopServer', serverName: currentServer });
    console.log(`Zatrzymuję ${currentServer}, chill! 😛`);
}

function restartServer() {
    if (currentServer) sendMessage({ type: 'restartServer', serverName: currentServer });
    console.log(`Restartuję ${currentServer}, dawaj na nowo! 💪`);
}

function killServer() {
    if (currentServer) sendMessage({ type: 'killServer', serverName: currentServer });
    console.log(`Zabijam ${currentServer}, bez litości! 😈`);
}

function deleteServer() {
    if (currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'deleteServer', serverName: currentServer });
        setCurrentServer(null);
        document.getElementById('serverContent').style.display = 'none';
    }
}

function sendCommand() {
    const input = document.getElementById('consoleInput');
    const command = input.value.trim();
    if (command && currentServer) {
        sendMessage({ type: 'sendCommand', serverName: currentServer, command });
        input.value = '';
        console.log(`Wysłałem komendę "${command}" do ${currentServer}, zajebiście! 👍`);
    }
}

function clearConsole() {
    if (currentServer) {
        consoleLines.set(currentServer, []);
        updateConsole(currentServer);
    }
}

function loadConsoleFromLog(serverName) {
    const lines = consoleLines.get(serverName) || [];
    if (lines.length === 0) consoleLines.set(serverName, []);
    updateConsole(serverName);
}

function updateConsole(serverName) {
    const consoleDiv = document.getElementById('console');
    const lines = consoleLines.get(serverName) || [];
    consoleDiv.textContent = lines.join('\n');
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

export function showServerContext(event) {
    event.preventDefault();
    const target = event.target.closest('.server-item');
    if (!target) return;
    const name = target.textContent.split(' (MC')[0].trim(); // Wyciągamy nazwę bez wersji
    const isRunning = servers[name].running;
    const menu = document.getElementById('serverContext');
    menu.innerHTML = ''; // Czyścimy menu

    if (!isRunning) {
        const start = document.createElement('div');
        start.textContent = '🟢 Włącz';
        start.addEventListener('click', startServer);
        menu.appendChild(start);
    }
    if (isRunning) {
        const stop = document.createElement('div');
        stop.textContent = '🔴 Zatrzymaj';
        stop.addEventListener('click', stopServer);
        menu.appendChild(stop);

        const restart = document.createElement('div');
        restart.textContent = '🔄 Restartuj';
        restart.addEventListener('click', restartServer);
        menu.appendChild(restart);

        const kill = document.createElement('div');
        kill.textContent = '💀 Zabij';
        kill.addEventListener('click', killServer);
        menu.appendChild(kill);
    }
    if (!isRunning) {
        const del = document.createElement('div');
        del.textContent = '🗑️ Usuń';
        del.addEventListener('click', deleteServer);
        menu.appendChild(del);
    }

    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    menu.style.display = 'block';
    document.addEventListener('click', () => menu.style.display = 'none', { once: true });
}

// Placeholder functions to be defined elsewhere
let updateProperties = () => {};
let updatePlayersManagement = () => {};
export function setServerCallbacks({ properties, players, mods }) {
    updateProperties = properties || updateProperties;
    updatePlayersManagement = players || updatePlayersManagement;
    if (mods) updateMods = mods;
}