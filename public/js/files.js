import { sendMessage, currentServer, setUpdateCallbacks } from './websocket.js';

export function initFiles() {
    document.getElementById('jarUpload').addEventListener('change', uploadJar);

    setUpdateCallbacks({
        updateFileList: (path, files) => {
            const list = document.getElementById('fileList');
            list.innerHTML = '';
            if (path) {
                const back = document.createElement('div');
                back.className = 'file-item';
                back.textContent = '⬆ Wróć';
                back.dataset.path = path.split('/').slice(0, -1).join('/');
                back.dataset.isDir = 'true';
                back.addEventListener('click', () => openDir(back.dataset.path));
                back.addEventListener('contextmenu', (e) => showFileContext(e)); // Dodajemy menu kontekstowe
                list.appendChild(back);
            }
            const sortedFiles = files.sort((a, b) => a.isDir === b.isDir ? a.name.localeCompare(b.name) : b.isDir ? 1 : -1);
            sortedFiles.forEach(file => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.textContent = `${file.isDir ? '📁' : '📄'} ${file.name}`;
                div.dataset.path = path ? `${path}/${file.name}` : file.name;
                div.dataset.isDir = file.isDir;
                if (file.isDir) div.addEventListener('click', () => openDir(div.dataset.path));
                div.addEventListener('contextmenu', (e) => showFileContext(e)); // Dodajemy menu kontekstowe
                list.appendChild(div);
            });
        }
    });
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

function openDir(path) {
    sendMessage({ type: 'getFiles', serverName: currentServer, path });
}

export function showFileContext(event) {
    event.preventDefault();
    const target = event.target.closest('.file-item');
    if (!target) return;
    const path = target.dataset.path;
    const isDir = target.dataset.isDir === 'true';
    const menu = document.getElementById('fileContext');
    menu.innerHTML = `
        <div onclick="renameFile('${path}')">✏️ Zmień nazwę</div>
        <div onclick="deleteFile('${path}')">🗑️ Usuń</div>
        ${isDir ? `<div onclick="openDir('${path}')">📂 Otwórz</div>` : ''}
    `;
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    menu.style.display = 'block';
    document.addEventListener('click', () => menu.style.display = 'none', { once: true });
}

function renameFile(path) {
    const newName = prompt('Nowa nazwa:', path.split('/').pop());
    if (newName) sendMessage({ type: 'renameFile', serverName: currentServer, path, newName });
}

function deleteFile(path) {
    if (confirm('Na pewno usunąć?')) sendMessage({ type: 'deleteFile', serverName: currentServer, path });
}