const fs = require('fs').promises;
const path = require('path');
const { log } = require('../utils/logger');
const { servers, saveInstance, loadServerFiles } = require('./serverManager');

async function uploadJar(serverName, dataUrl, filename) {
    if (servers[serverName].running) {
        log('error', `[JAR_UPLOAD_ERROR] Serwer ${serverName} działa, zatrzymaj go przed zmianą JAR!`);
        return;
    }
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const jarPath = path.join(servers[serverName].dir, filename || 'server.jar');
    await fs.writeFile(jarPath, buffer);
    servers[serverName].jar = filename || 'server.jar';
    log('info', `[JAR_UPLOAD_DEBUG] Zapisano JAR w: ${jarPath}`);
}

async function uploadIcon(serverName, dataUrl) {
    if (servers[serverName].running) {
        log('error', `[ICON_UPLOAD_ERROR] Serwer ${serverName} działa, zatrzymaj go przed zmianą ikony!`);
        return;
    }
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const iconPath = path.join(servers[serverName].dir, 'server-icon.png');
    await fs.writeFile(iconPath, buffer);
}

async function getIcon(serverName) {
    const iconPath = path.join(servers[serverName].dir, 'server-icon.png');
    try {
        const buffer = await fs.readFile(iconPath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch {
        return null;
    }
}

async function getFiles(serverName, relativePath) {
    const basePath = servers[serverName].dir;
    const fullPath = path.join(basePath, relativePath);
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    return files.map(file => ({
        name: file.name,
        isDir: file.isDirectory()
    }));
}

async function renameFile(serverName, oldPath, newName) {
    const basePath = servers[serverName].dir;
    const oldFullPath = path.join(basePath, oldPath);
    const newFullPath = path.join(path.dirname(oldFullPath), newName);
    await fs.rename(oldFullPath, newFullPath);
    await loadServerFiles(serverName);
}

async function deleteFile(serverName, filePath) {
    const fullPath = path.join(servers[serverName].dir, filePath);
    await fs.rm(fullPath, { recursive: true, force: true });
    await loadServerFiles(serverName);
}

module.exports = {
    uploadJar,
    uploadIcon,
    getIcon,
    getFiles,
    renameFile,
    deleteFile
};