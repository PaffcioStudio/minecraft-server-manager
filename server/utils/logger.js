const fs = require('fs').promises;
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');

// Tworzymy folder logs, jeśli nie istnieje
async function ensureLogsDir() {
    await fs.mkdir(logsDir, { recursive: true }).catch(() => {});
}

// Rotacja logów przy starcie
async function rotateLogs() {
    await ensureLogsDir();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFiles = ['app.log', 'error.log', 'minecraft.log', 'server.log', 'debug.log'];

    for (const file of logFiles) {
        const logPath = path.join(logsDir, file);
        if (await fs.access(logPath).then(() => true).catch(() => false)) {
            const newLogPath = path.join(logsDir, `${file.split('.')[0]}_${timestamp}.log`);
            await fs.rename(logPath, newLogPath);
            await log('server', 'info', `[LOG_ROTATE] Przeniesiono ${file} do ${newLogPath}`); // Dodano 'info'
        }
    }
}

// Funkcja logowania z kategoriami
async function log(category, level, message, error) {
    const timestamp = new Date().toISOString();
    const output = `[${timestamp}] [${level.toUpperCase()}] ${message}${error ? `: ${error}` : ''}`;
    
    // Wybór pliku na podstawie kategorii
    let logFile;
    switch (category.toLowerCase()) {
        case 'minecraft':
            logFile = 'minecraft.log';
            break;
        case 'server':
            logFile = 'server.log';
            break;
        case 'debug':
            logFile = 'debug.log';
            break;
        case 'error':
            logFile = 'error.log';
            break;
        default:
            logFile = 'app.log'; // Fallback
    }

    // Jeśli poziom to error, zawsze do error.log
    if (level.toLowerCase() === 'error') {
        logFile = 'error.log';
    }

    const logPath = path.join(logsDir, logFile);
    
    try {
        await fs.appendFile(logPath, output + '\n');
    } catch (e) {
        console.error(`[LOGGER_ERROR] Nie udało się zapisać do ${logFile}: ${e}`);
    }

    // Tylko błędy w konsoli
    if (level.toLowerCase() === 'error') {
        console.log(output);
    }
}

// Rotacja przy starcie
rotateLogs().then(() => {
    log('server', 'info', '[LOGGER_INIT] Logger zainicjalizowany, logi idą do plików!');
});

module.exports = { log };