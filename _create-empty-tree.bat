# Tworzenie katalogów
$folders = @(
    "public", "public\css", "public\js", "public\img",
    "server", "server\controllers", "server\utils", "server\servers",
    "server\javas", "logs"
)

foreach ($folder in $folders) {
    New-Item -Path $folder -ItemType Directory -Force | Out-Null
}

# Tworzenie pustych plików
$files = @(
    "public\css\styles.css",
    "public\css\dark-theme.css",
    "public\css\light-theme.css",
    
    "public\js\main.js",
    "public\js\websocket.js",
    "public\js\ui.js",
    "public\js\server.js",
    "public\js\files.js",
    "public\js\mods.js",
    "public\js\settings.js",
    "public\js\java.js",
    
    "public\index.html",
    
    "server\controllers\serverManager.js",
    "server\controllers\fileManager.js",
    "server\controllers\javaManager.js",
    "server\controllers\wsHandler.js",
    
    "server\utils\logger.js",
    "server\utils\configLoader.js",
    "server\utils\helpers.js",
    
    "server\server.js",
    "server\config.json",
    
    "logs\app.log",
    "logs\error.log",
    
    ".gitignore",
    "start.sh",
    "start.bat",
    "README.md"
)

foreach ($file in $files) {
    New-Item -Path $file -ItemType File -Force | Out-Null
}

Write-Host "✅ Struktura projektu została utworzona!" -ForegroundColor Green
