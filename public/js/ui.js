import { sendMessage, currentServer } from './websocket.js';
import { updateJava } from './java.js'; // Importujemy z java.js

export function initUI() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
            if (tab.dataset.tab === 'files' && currentServer) {
                sendMessage({ type: 'getFiles', serverName: currentServer, path: '' });
            } else if (tab.dataset.tab === 'java' && currentServer) {
                updateJava(currentServer); // Poprawnie wywołujemy
            } else if (tab.dataset.tab === 'logs' && currentServer) {
                sendMessage({ type: 'getLog', serverName: currentServer, logFile: document.getElementById('logSelect').value });
            }
            console.log(`Przełączono na: ${tab.dataset.tab}, zajebiście! 😁`);
        });
    });
    tabs[0]?.click(); // Domyślna zakładka
}

export function updateLogs(logContent) {
    const logsDiv = document.getElementById('logs');
    logsDiv.textContent = logContent || 'Brak logów, kurwa mać! 😢';
    logsDiv.scrollTop = logsDiv.scrollHeight; // Auto-scroll na dół
}