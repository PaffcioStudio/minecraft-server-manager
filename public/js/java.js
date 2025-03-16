import { sendMessage, sendDebouncedMessage, servers, currentServer, javaVersions, setUpdateCallbacks } from './websocket.js';

// Debounce dla setRam
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const debouncedSetRam = debounce((serverName, ram) => {
    if (servers[serverName].ram !== parseInt(ram, 10)) { // Wysyłamy tylko, jeśli RAM się zmienił
        sendMessage({ type: 'setRam', serverName, ram });
        console.log(`Ustawiono RAM na ${ram}G dla ${serverName}, zajebiście! 😎`);
    }
}, 1000); // Zwiększone do 1000ms

export function initJava() {
    document.getElementById('jarUpload').addEventListener('change', uploadJar);

    setUpdateCallbacks({
        updateJava,
        updateJavaVersions
    });
}

export function updateJava(serverName) {
    const isRunning = servers[serverName].running;

    const versionPanel = document.getElementById('javaVersionPanel');
    versionPanel.innerHTML = '';
    const select = document.createElement('select');
    select.id = 'javaVersion';
    select.addEventListener('change', () => setJava(select.value));
    select.disabled = isRunning;
    versionPanel.appendChild(select);
    updateJavaVersions();

    const resourcesPanel = document.getElementById('javaResourcesPanel');
    resourcesPanel.innerHTML = '';
    const ramDiv = document.createElement('div');
    ramDiv.innerHTML = `
        <input type="range" min="1" max="32" value="${servers[serverName].ram || 2}" id="ram" ${isRunning ? 'disabled' : ''}>
        <span>RAM: <span id="ramValue">${servers[serverName].ram || 2}</span> GB</span>
    `;
    resourcesPanel.appendChild(ramDiv);
    const ramInput = document.getElementById('ram');
    ramInput.addEventListener('input', () => {
        document.getElementById('ramValue').textContent = ramInput.value;
        debouncedSetRam(serverName, ramInput.value); // Debounce z warunkiem
    });

    const params = document.createElement('div');
    params.innerHTML = `
        <input type="text" class="java-params" placeholder="Dodatkowe parametry Javy (np. -Xms2G)" value="${servers[serverName].javaParams || ''}" ${isRunning ? 'disabled' : ''}>
    `;
    resourcesPanel.appendChild(params);
    const paramsInput = params.querySelector('.java-params');
    paramsInput.addEventListener('change', () => setJavaParams(paramsInput.value));

    const jarPanel = document.getElementById('javaJarPanel');
    const jarUpload = document.getElementById('jarUpload');
    jarUpload.disabled = isRunning;
    const currentJar = document.getElementById('currentJar');
    currentJar.textContent = servers[serverName].jar || 'Nie wybrano pliku.';
}

export function updateJavaVersions() {
    const select = document.getElementById('javaVersion');
    if (!select) return;
    select.innerHTML = '<option value="">Wybierz wersję Java</option>';
    javaVersions.forEach(v => {
        const option = document.createElement('option');
        option.value = v.path;
        option.textContent = v.version;
        if (v.path === servers[currentServer]?.javaPath) option.selected = true;
        select.appendChild(option);
    });
    console.log(`Wczytano Javy: ${javaVersions.map(v => v.version).join(', ')}, zajebiście! 😎`);
}

function uploadJar() {
    const file = document.getElementById('jarUpload').files[0];
    if (file && currentServer) {
        const reader = new FileReader();
        reader.onload = () => sendMessage({
            type: 'uploadJar',
            serverName: currentServer,
            data: reader.result,
            filename: file.name
        });
        reader.readAsDataURL(file);
    }
}

function setJava(version) {
    if (currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'setJava', serverName: currentServer, version });
        console.log(`Zmiana Javy na ${version} dla ${currentServer}, w chuj git! 🔥`);
    }
}

function setRam(ram) {
    if (currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'setRam', serverName: currentServer, ram });
    }
}

function setJavaParams(params) {
    if (currentServer && !servers[currentServer].running) {
        sendMessage({ type: 'setJavaParams', serverName: currentServer, params });
        console.log(`Parametry Javy zmienione na ${params} dla ${currentServer}, elegancko! 👍`);
    }
}