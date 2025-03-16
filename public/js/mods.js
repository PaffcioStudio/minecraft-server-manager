import { sendMessage, servers, currentServer } from './websocket.js';

export function initMods() {
    document.getElementById('modUpload').addEventListener('change', uploadMod);
    document.getElementById('modSearch').addEventListener('input', (e) => filterMods(e.target.value));
}

function updateMods(serverName) {
    const list = document.getElementById('modsList');
    list.innerHTML = '';
    const isRunning = servers[serverName].running;
    const mods = servers[serverName].mods || [];
    mods.forEach(mod => {
        const div = document.createElement('div');
        div.textContent = mod;
        const btns = document.createElement('span');
        btns.innerHTML = `
            <button onclick="toggleMod('${mod}', ${!mod.endsWith('.disabled')})" ${isRunning ? 'disabled' : ''}>${mod.endsWith('.disabled') ? 'Włącz' : 'Wyłącz'}</button>
            <button onclick="deleteMod('${mod}')" ${isRunning ? 'disabled' : ''}>Usuń</button>
        `;
        div.appendChild(btns);
        list.appendChild(div);
    });
    document.getElementById('modUpload').disabled = isRunning;
}

function filterMods(query) {
    const list = document.getElementById('modsList');
    Array.from(list.children).forEach(div => {
        div.style.display = div.textContent.toLowerCase().includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

function toggleMod(mod, disable) {
    if (servers[currentServer].running) return;
    sendMessage({ type: disable ? 'disableMod' : 'enableMod', serverName: currentServer, mod });
}

function uploadMod() {
    const file = document.getElementById('modUpload').files[0];
    if (file && currentServer && !servers[currentServer].running) {
        const reader = new FileReader();
        reader.onload = () => sendMessage({ type: 'uploadMod', serverName: currentServer, data: reader.result, filename: file.name });
        reader.readAsDataURL(file);
    }
}

function deleteMod(mod) {
    if (currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'deleteMod', serverName: currentServer, mod });
    }
}

export { updateMods };