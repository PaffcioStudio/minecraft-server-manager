import { initWebSocket } from './websocket.js';
import { initUI } from './ui.js';
import { initServers } from './server.js';
import { initFiles } from './files.js';
import { initMods } from './mods.js';
import { initSettings } from './settings.js';
import { initJava } from './java.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Kurwa, ziom, appka startuje! 😂');
    initWebSocket();
    initUI();
    initServers();
    initFiles();
    initMods();
    initSettings();
    initJava();
});