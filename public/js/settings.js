import { sendMessage, servers, currentServer } from './websocket.js';
import { setServerCallbacks } from './server.js';

const SERVER_PROPERTIES_DB = {
    'motd': { label: 'MOTD', icon: '📜', desc: 'Wiadomość dnia wyświetlana w menu gry', type: 'text' },
    'difficulty': { label: 'Trudność', icon: '⚔️', desc: 'Poziom trudności gry', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
    'gamemode': { label: 'Tryb gry', icon: '🎮', desc: 'Domyślny tryb gry dla nowych graczy', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
    'max-players': { label: 'Max graczy', icon: '👥', desc: 'Maksymalna liczba graczy na serwerze', type: 'number', min: 1 },
    'pvp': { label: 'PvP', icon: '🤺', desc: 'Włącza/wyłącza walkę między graczami', type: 'checkbox' },
    'online-mode': { label: 'Online Mode', icon: '🌐', desc: 'Weryfikacja licencji przez Mojang', type: 'checkbox' },
    'level-type': { label: 'Typ świata', icon: '🌍', desc: 'Rodzaj generowanego świata', type: 'select', options: ['DEFAULT', 'FLAT', 'LARGEBIOMES', 'AMPLIFIED', 'CUSTOMIZED'] },
    'spawn-protection': { label: 'Ochrona spawnu', icon: '🛡️', desc: 'Promień ochrony spawnu w blokach', type: 'number', min: 0 },
    'hardcore': { label: 'Hardcore', icon: '💀', desc: 'Włącza tryb hardcore', type: 'checkbox' },
    'allow-flight': { label: 'Latanie', icon: '✈️', desc: 'Pozwala na latanie w trybie survival', type: 'checkbox' },
    'generate-structures': { label: 'Struktury', icon: '🏰', desc: 'Generuje wioski, świątynie itp.', type: 'checkbox' },
    'level-seed': { label: 'Seed świata', icon: '🌱', desc: 'Seed do generowania świata', type: 'text' },
    'enforce-whitelist': { label: 'Wymagaj białej listy', icon: '📋', desc: 'Blokuje graczy spoza białej listy', type: 'checkbox' },
    'resource-pack': { label: 'Paczka zasobów', icon: '🎨', desc: 'URL do paczki zasobów', type: 'text' },
    'resource-pack-sha1': { label: 'SHA1 paczki', icon: '🔑', desc: 'Hash SHA1 paczki zasobów', type: 'text' },
    'server-port': { label: 'Port serwera', icon: '🔌', desc: 'Port, na którym działa serwer', type: 'number', min: 1, max: 65535 },
    'white-list': { label: 'Biała lista', icon: '✅', desc: 'Włącza białą listę', type: 'checkbox' }
};

export function initSettings() {
    document.getElementById('serverNameEdit').addEventListener('change', (e) => renameServer(e.target.value));
    document.getElementById('iconUpload').addEventListener('change', uploadIcon);
    document.getElementById('submitModalBtn').addEventListener('click', submitModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    setServerCallbacks({
        properties: updateProperties,
        players: updatePlayersManagement
    });
}

function updateProperties(props) {
    const container = document.getElementById('properties');
    container.innerHTML = '';
    const sections = {
        'Ogólne': [],
        'Rozgrywka': [],
        'Świat': [],
        'Sieć': []
    };

    Object.keys(SERVER_PROPERTIES_DB).forEach(key => {
        if (props.hasOwnProperty(key)) {
            const field = SERVER_PROPERTIES_DB[key];
            const div = document.createElement('div');
            div.className = 'property';
            div.innerHTML = `<label>${field.icon} ${field.label}: `;
            if (field.type === 'select') {
                const select = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === props[key]) option.selected = true;
                    select.appendChild(option);
                });
                select.onchange = () => editProperties();
                select.id = key;
                div.appendChild(select);
            } else if (field.type === 'checkbox') {
                const container = document.createElement('div');
                container.className = 'checkbox-container';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = props[key] === 'true';
                input.onchange = () => editProperties();
                input.id = key;
                container.appendChild(input);
                container.appendChild(document.createTextNode(' '));
                div.appendChild(container);
            } else {
                const input = document.createElement('input');
                input.type = field.type || 'text';
                if (field.min) input.min = field.min;
                if (field.max) input.max = field.max;
                input.value = props[key];
                input.onchange = () => editProperties();
                input.id = key;
                div.appendChild(input);
            }
            div.innerHTML += `</label><span>${field.desc}</span>`;
            if (['motd', 'max-players', 'online-mode'].includes(key)) sections['Ogólne'].push(div);
            else if (['difficulty', 'gamemode', 'pvp', 'hardcore', 'allow-flight'].includes(key)) sections['Rozgrywka'].push(div);
            else if (['level-type', 'spawn-protection', 'generate-structures', 'level-seed'].includes(key)) sections['Świat'].push(div);
            else if (['server-port', 'white-list', 'enforce-whitelist', 'resource-pack', 'resource-pack-sha1'].includes(key)) sections['Sieć'].push(div);
        }
    });

    Object.keys(sections).forEach(section => {
        if (sections[section].length > 0) {
            const secDiv = document.createElement('div');
            secDiv.className = 'section';
            secDiv.innerHTML = `<h3>${section}</h3>`;
            sections[section].forEach(div => secDiv.appendChild(div));
            container.appendChild(secDiv);
        }
    });
}

function editProperties() {
    if (!currentServer) return;
    const props = {};
    Object.keys(SERVER_PROPERTIES_DB).forEach(id => {
        const el = document.getElementById(id);
        if (el) props[id] = el.type === 'checkbox' ? String(el.checked) : el.value;
    });
    sendMessage({ type: 'editProperties', serverName: currentServer, properties: props });
}

function updatePlayersManagement(containerId, file, headers, key) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'file-table';
    table.innerHTML = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    const data = servers[currentServer].files[file] ? JSON.parse(servers[currentServer].files[file]) : [];
    data.forEach((entry, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry[key]}</td>
            ${file === 'ops.json' ? `<td>${entry.level || 4}</td>` : headers.length > 2 ? `<td>${entry.reason || 'Brak'}</td>` : ''}
            <td><button onclick="removeEntry('${file}', ${i})">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Dodaj';
    addBtn.addEventListener('click', () => showModal(file, key));
    container.appendChild(table);
    container.appendChild(addBtn);
}

let modalCallback = null;

function showModal(file, key) {
    const modal = document.getElementById('entryModal');
    const title = document.getElementById('modalTitle');
    const input = document.getElementById('modalInput');
    title.textContent = `Dodaj ${key === 'ip' ? 'IP' : 'nick'}`;
    input.value = '';
    modal.style.display = 'flex';
    modalCallback = (value) => {
        if (!value) return;
        const data = servers[currentServer].files[file] ? JSON.parse(servers[currentServer].files[file]) : [];
        const entry = key === 'ip' ? { ip: value, reason: 'Manual', created: new Date().toISOString(), expires: 'forever', source: 'Panel' } :
                     file === 'ops.json' ? { uuid: 'manual-' + Date.now(), name: value, level: 4 } :
                     file === 'whitelist.json' ? { uuid: 'manual-' + Date.now(), name: value } :
                     { uuid: 'manual-' + Date.now(), name: value, reason: 'Manual', created: new Date().toISOString(), expires: 'forever', source: 'Panel' };
        data.push(entry);
        sendMessage({ type: 'editFile', serverName: currentServer, file, content: JSON.stringify(data, null, 2) });
    };
}

function submitModal() {
    const input = document.getElementById('modalInput').value;
    if (modalCallback) modalCallback(input);
    closeModal();
}

function closeModal() {
    document.getElementById('entryModal').style.display = 'none';
    modalCallback = null;
}

function removeEntry(file, index) {
    const data = JSON.parse(servers[currentServer].files[file]);
    data.splice(index, 1);
    sendMessage({ type: 'editFile', serverName: currentServer, file, content: JSON.stringify(data, null, 2) });
}

function renameServer(newName) {
    if (newName && newName !== currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'renameServer', serverName: currentServer, newName });
        setCurrentServer(newName); // Aktualizujemy currentServer po zmianie nazwy
    } else if (servers[currentServer].running) {
        alert('Kurwa, zatrzymaj serwer, zanim zmienisz nazwę! 😛');
    }
}

function uploadIcon() {
    const file = document.getElementById('iconUpload').files[0];
    if (file && currentServer && !servers[currentServer].running) {
        const reader = new FileReader();
        reader.onload = () => sendMessage({ type: 'uploadIcon', serverName: currentServer, data: reader.result });
        reader.readAsDataURL(file);
    } else if (servers[currentServer].running) {
        alert('Zatrzymaj serwer, zanim wrzucisz nową ikonę, ziom! 😜');
    }
}