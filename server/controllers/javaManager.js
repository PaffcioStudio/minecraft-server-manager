const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const { log } = require('../utils/logger');

let javaVersions = [];
const javaConfigPath = path.join(__dirname, '../java-config.json');

async function initJava(config) {
    log('server', 'info', '[JAVA_INIT] Inicjalizacja konfiguracji Java...');
    await fs.mkdir(path.join(__dirname, '../javas'), { recursive: true });

    try {
        const configData = await fs.readFile(javaConfigPath, 'utf8');
        javaVersions = JSON.parse(configData);
        log('server', 'info', `[JAVA_CONFIG_READ] Wczytano wersje Java z konfiguracji: ${javaVersions.map(v => v.version).join(', ')}`);
    } catch (e) {
        log('server', 'warn', '[JAVA_CONFIG_READ] Brak pliku java-config.json lub błąd parsowania, startujemy od zera');
        javaVersions = [];
    }

    const systemVersions = await checkSystemJava();
    systemVersions.forEach(v => {
        if (!javaVersions.some(jv => jv.version === v.version)) {
            javaVersions.push(v);
            log('server', 'info', `[JAVA_FOUND] Dodano systemową wersję Java: ${v.version}`);
        }
    });

    const localVersions = await scanJavaVersions();
    log('debug', 'info', `[JAVA_LOCAL_VERSIONS] Zescannowane lokalne wersje: ${JSON.stringify(localVersions)}`);
    localVersions.forEach(v => {
        if (!javaVersions.some(jv => jv.version === v.version)) {
            javaVersions.push(v);
            log('server', 'info', `[JAVA_FOUND] Dodano lokalną wersję Java: ${v.version}`);
        }
    });

    log('debug', 'info', `[JAVA_VERSIONS_PRE_SAVE] Stan javaVersions przed zapisem: ${JSON.stringify(javaVersions)}`);
    if (javaVersions.length === 0 && config.javaToDownload) {
        log('server', 'info', '[JAVA_DOWNLOAD_START] Nie znaleziono wersji Java, pobieranie domyślnych...');
        for (const version of config.javaToDownload) {
            await downloadJava(version);
        }
        javaVersions = await scanJavaVersions();
    }

    await saveJavaConfig();
    log('debug', 'info', `[JAVA_VERSIONS_POST_INIT] Końcowy stan javaVersions: ${JSON.stringify(javaVersions)}`);
}

async function checkSystemJava() {
    const versions = [];
    try {
        const javaCheck = spawn('java', ['-version'], { shell: true });
        return new Promise((resolve) => {
            javaCheck.stderr.on('data', (data) => {
                const version = data.toString().match(/version "(.+?)"/)?.[1];
                if (version) {
                    versions.push({ version: `java-${version}`, path: 'java' });
                }
            });
            javaCheck.on('close', () => resolve(versions));
        });
    } catch (e) {
        log('error', 'error', '[JAVA_ERROR] Błąd podczas sprawdzania systemowej Java', e);
        return versions;
    }
}

async function downloadJava(version) {
    const url = `https://api.adoptium.net/v3/binary/latest/${version}/ga/windows/x64/jdk/hotspot/normal/adoptium`;
    const filePath = path.join(__dirname, '../javas', `java-${version}.zip`);
    log('server', 'info', `[JAVA_DOWNLOAD_${version}] Pobieranie Java ${version} dla Windows...`);

    const file = await fs.open(filePath, 'w');
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.pipe(file.createWriteStream());
            res.on('end', async () => {
                file.close();
                await extractJava(filePath, version);
                resolve();
            });
        }).on('error', (e) => {
            log('error', 'error', `[JAVA_DOWNLOAD_ERROR] Błąd pobierania Java ${version}`, e);
            reject(e);
        });
    });
}

async function extractJava(filePath, version) {
    const extractDir = path.join(__dirname, '../javas', `java-${version}`);
    await fs.mkdir(extractDir, { recursive: true });
    const unzip = spawn('powershell', ['Expand-Archive', '-Path', filePath, '-DestinationPath', extractDir], { shell: true });
    return new Promise((resolve) => {
        unzip.on('close', async (code) => {
            if (code === 0) {
                await fs.unlink(filePath);
            }
            resolve();
        });
    });
}

async function scanJavaVersions() {
    const javaDir = path.join(__dirname, '../javas');
    try {
        const dirs = await fs.readdir(javaDir);
        const versions = [];
        for (const dir of dirs) {
            log('debug', 'info', `[JAVA_SCAN_DEBUG] Sprawdzam folder: ${dir}`);
            const javaPathDirect = path.join(javaDir, dir, 'bin', 'java.exe');
            const subDirs = await fs.readdir(path.join(javaDir, dir)).catch(() => []);
            let javaPath = javaPathDirect;

            if (subDirs.length > 0) {
                const subDirPath = path.join(javaDir, dir, subDirs[0], 'bin', 'java.exe');
                if (await fs.access(subDirPath).then(() => true).catch(() => false)) {
                    javaPath = subDirPath;
                }
            }

            const exists = await fs.access(javaPath).then(() => true).catch(() => false);
            log('debug', 'info', `[JAVA_SCAN_DEBUG] Ścieżka ${javaPath} - istnieje: ${exists}`);
            if (exists) {
                versions.push({ version: dir, path: javaPath });
            }
        }
        log('server', 'info', `[JAVA_SCAN_RESULT] Znaleziono: ${versions.map(v => v.version).join(', ')}`);
        return versions;
    } catch (e) {
        log('error', 'error', '[JAVA_SCAN_ERROR] Błąd skanowania katalogu javas:', e);
        return [];
    }
}

async function saveJavaConfig() {
    await fs.writeFile(javaConfigPath, JSON.stringify(javaVersions, null, 2));
    log('server', 'info', '[JAVA_CONFIG_SAVED] Zaktualizowano plik konfiguracyjny Java');
}

module.exports = {
    javaVersions,
    initJava,
    scanJavaVersions
};