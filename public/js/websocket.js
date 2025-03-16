import { updateServersList, updateServerView } from './server.js';
import { updateLogs } from './ui.js';
import { updateJava, updateJavaVersions } from './java.js';

export let ws;
export const servers = {};
export let currentServer = null;
export const consoleLines = new Map();
export const javaVersions = [];
export const MAX_LINES = 1000;

let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

const callbacks = {
    updateServersList: () => {},
    updateServerView: () => {},
    appendConsole: () => {},
    detectServerVersion: () => {},
    updateFileList: () => {}
};

export function setUpdateCallbacks({ updateServersList, updateServerView, appendConsole, detectServerVersion, updateFileList }) {
    if (updateServersList) callbacks.updateServersList = updateServersList;
    if (updateServerView) callbacks.updateServerView = updateServerView;
    if (appendConsole) callbacks.appendConsole = appendConsole;
    if (detectServerVersion) callbacks.detectServerVersion = detectServerVersion;
    if (updateFileList) callbacks.updateFileList = updateFileList;
}

export function setCurrentServer(name) {
    currentServer = name;
    if (currentServer) callbacks.updateServerView(currentServer);
}

function connect() {
    ws = new WebSocket('ws://192.168.0.197:8080'); // Twoje IP serwera

    ws.onopen = () => {
        console.log('WebSocket podłączony, zajebiście! 🔥');
        reconnectAttempts = 0;
        sendMessage({ type: 'getServers' });
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket dane:', data);
        switch (data.type) {
            case 'servers':
                Object.assign(servers, data.servers); // Mergujemy zamiast nadpisywać
                console.log('Serwery z backendu:', servers);
                callbacks.updateServersList();
                if (currentServer) callbacks.updateServerView(currentServer);
                break;
            case 'console':
                callbacks.appendConsole(data.serverName, data.output);
                callbacks.detectServerVersion(data.serverName, data.output);
                break;
            case 'javaVersions':
                javaVersions.length = 0;
                javaVersions.push(...data.versions);
                updateJavaVersions();
                break;
            case 'fileList':
                callbacks.updateFileList(data.path, data.files);
                break;
            case 'icon':
                document.getElementById('serverIcon').src = data.data;
                break;
            case 'logContent':
                updateLogs(data.logContent);
                break;
        }
    };

    ws.onclose = () => {
        console.log('WebSocket rozłączony, kurwa mać! 😢');
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connect, 1000 * reconnectAttempts); // 1s, 2s, 3s...
        } else {
            console.log('Za dużo prób, pierdolę to! 😡');
        }
    };

    ws.onerror = (err) => {
        console.log('WebSocket error, co za chujnia! 😡', err);
    };
}

export function sendMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.log('WebSocket niegotowy, kurwa czekaj!', message);
    }
}

// Debounced wysyłanie wiadomości
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const sendDebouncedMessage = debounce((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.log('WebSocket niegotowy, kurwa mać! 😡');
    }
}, 500);

export function initWebSocket() {
    connect();
}

connect();