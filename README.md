# Minecraft Server Manager

A powerful web-based tool for managing multiple Minecraft server instances, handling server files, Java versions, and real-time communication via WebSockets.

## Logs Overview
- **`debug.log`**: Stores detailed debug information for troubleshooting.
- **`minecraft.log`**: Captures essential events from the Minecraft server console.

## Features
- **🖥️ Server Control**: Start, stop, and monitor multiple Minecraft servers.
- **📁 File Management**: Browse, upload, and edit server files from the web UI.
- **☕ Java Versioning**: Easily switch between Java versions for compatibility.
- **🔄 Live Updates**: WebSockets provide real-time status and logs.
- **🛠️ Mod Support**: Install, remove, and configure mods.
- **⚙️ Settings Editor**: Modify server settings via an intuitive interface.
- **🖥️ Cross-Platform**: Works on Windows, Linux, and macOS.

## Setup Guide

### Prerequisites
- **🟢 Node.js** (18.x or higher recommended)
- **📦 npm** (Included with Node.js)
- **🔗 Git** (Optional, for cloning the repository)

### Installation Steps

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/PaffcioStudio/minecraft-server-manager.git
cd minecraft-server-manager
```
Or download and extract the ZIP file.

#### 2️⃣ Install Dependencies
```bash
npm install
```

#### 3️⃣ Configure the Application
- Modify `server/config.json` as needed.
- Ensure `server/javas` contains the required Java versions.

#### 4️⃣ Prepare Server Instances (Optional)
- Place `server.jar` files in `server/servers/<instance-name>/`.
- Accept the Minecraft EULA by setting `eula=true` in `server.properties`.

### Running the Manager

#### ▶️ Start the Backend
```bash
node server/server.js
```
Or use the provided scripts:

- **🪟 Windows**: Run `start.bat`
- **🐧 Linux/macOS**: Run `./start.sh` (make executable with `chmod +x start.sh`)

#### 🌍 Access the Web Interface
Open `http://localhost:3000` in your browser.

### Development in VS Code (Optional)
- Open the project in VS Code.
- Press `F5` to run with debugging (configured in `.vscode/launch.json`).

## 📂 Project Structure
```
📦 minecraft-server-manager
├── 📂 public                # Frontend static files
│   ├── 📂 css               # Stylesheets
│   │   ├── styles.css       # Main interface styles
│   │   ├── dark-theme.css   # Dark theme styles (optional)
│   │   ├── light-theme.css  # Light theme styles (optional)
│   ├── 📂 js                # Frontend JavaScript modules
│   │   ├── main.js          # Core application logic
│   │   ├── websocket.js     # WebSocket communication
│   │   ├── ui.js            # User interface logic
│   │   ├── server.js        # Server management (frontend)
│   │   ├── files.js         # Server file handling
│   │   ├── mods.js          # Mod management
│   │   ├── settings.js      # Server settings editor
│   │   ├── java.js          # Java version handling
│   ├── 📂 img               # Icons and graphics
│   │   ├── icon_16.png      # Favicon 16px
│   │   ├── icon_32.png      # Favicon 32px
│   │   ├── icon_96.png      # Favicon 96px
│   │   ├── icon_120.png     # Favicon 120px
│   ├── index.html           # Main frontend file
├── 📂 server                # Backend logic
│   ├── 📂 controllers       # Feature-specific modules
│   │   ├── serverManager.js # Minecraft server management
│   │   ├── fileManager.js   # File operations
│   │   ├── javaManager.js   # Java version management
│   │   ├── wsHandler.js     # WebSocket handling
│   ├── 📂 utils             # Utility functions
│   │   ├── logger.js        # Logging system (e.g., Winston)
│   │   ├── configLoader.js  # Configuration file loader
│   │   ├── helpers.js       # Helper functions
│   ├── 📂 servers           # Minecraft server instances
│   │   ├── 📂 serwer1       # Example server instance
│   │   │   ├── server.jar   # Server JAR file
│   │   │   ├── server.properties  # Server configuration
│   │   │   ├── eula.txt     # Minecraft EULA acceptance
│   │   │   ├── logs         # Server logs
│   │   │   ├── mods         # Mods folder
│   │   │   ├── world        # World files
│   ├── 📂 javas             # Java versions
│   │   ├── java-17          # Example Java 17 installation
│   │   ├── java-20          # Example Java 20 installation
│   ├── server.js            # Main backend file (Express + WebSocket)
│   ├── config.json          # Application configuration
│   ├── package.json         # Node.js dependencies
│   ├── README.md            # Project documentation
├── 📂 logs                  # Application logs
│   ├── app.log              # General application logs
│   ├── error.log            # Error logs
│   ├── debug.log            # Debugging information
│   ├── minecraft.log        # Extracted Minecraft server console output
├── 📂 .vscode               # Visual Studio Code configuration
│   ├── launch.json          # Debug/run configurations
│   ├── tasks.json           # Build and run tasks
│   ├── settings.json        # Project-specific settings
├── .gitignore               # Git ignored files
├── start.sh                 # Startup script for Linux/macOS
├── start.bat                # Startup script for Windows
```

## 🔍 Troubleshooting
- Check `logs/error.log` for issues.
- Ensure the correct Java version is used.
- Verify no other app is using the assigned port.

## 🤝 Contributing
Fork the repo, make changes, and submit a pull request. Follow the existing structure and document your code.

## 📜 License
Licensed under MIT. See `LICENSE` for details.
