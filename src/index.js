const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require('fs');
const gotTheLock = app.requestSingleInstanceLock();

require('./express-server');

let APP_NAME = "Colony Player";
let win;
let server;

if (!gotTheLock) {
  app.quit();
} else {
  const createMenu = () => {
    const template = [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  };

  const createWindow = () => {
    // Get the icon path for the current platform
    const iconPath = path.join(__dirname, 'static', 'icons', process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png');

    win = new BrowserWindow({
      title: APP_NAME,
      width: 800,
      height: 575,
      resizable: true,
      autoHideMenuBar: true,
      icon: iconPath,
      webPreferences: {
        plugins: true,
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        enableRemoteModule: true,
        backgroundThrottling: false,
      }
    });

    win.webContents.openDevTools(); // Open developer tools for debugging

    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'flash' || permission === 'plugins') {
        callback(true);
      } else {
        callback(false);
      }
    });

    win.webContents.on("new-window", (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    win.webContents.on("context-menu", (event, params) => {
      Menu.getApplicationMenu().popup(win, params.x, params.y);
    });

    // Load the HTML content
    const swfUrl = 'http://localhost:3000/static/ColonyV63.swf';

    console.log('Using SWF URL:', swfUrl);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Colony Player</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #000; }
        #flashContent { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="flashContent"></div>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const script = document.createElement("script");

            script.src = "http://localhost:3000/static/js/ruffle.js";
            script.onload = () => {
                try {
                    const ruffle = window.RufflePlayer.newest();
                    const container = document.getElementById("flashContent");

                    const player = ruffle.createPlayer();
                    player.style.width = "100%";
                    player.style.height = "100%";
                    container.appendChild(player);

                    console.log("Loading SWF from:", "${swfUrl}");
                    player.load("${swfUrl}");
                } catch (error) {
                    console.error("Ruffle initialization failed:", error);
                }
            };
            script.onerror = () => {
                console.error("Failed to load Ruffle script.");
            };
            document.body.appendChild(script);
        });
    </script>
</body>
</html>
    `;

    const tempHtmlPath = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'temp.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);

    win.loadFile(tempHtmlPath);
    win.center();

    win.on('closed', () => {
      win = null;  // Set the window object to null to avoid memory leaks
      if (server) {
        server.close(() => {
          console.log('Local server has been stopped.');
        });
      }
    });

    win.once("page-title-updated", function (event) {
      event.preventDefault();
      if (win && !win.isDestroyed()) {
        win.setTitle(APP_NAME);
      }
    });
  };

  app.setAsDefaultProtocolClient(app.getName());

  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.on("window-all-closed", () => {
    if (server) {
      server.close(() => {
        console.log('Local server has been stopped.');
      });
    }
    if (process.platform !== "darwin") app.quit();
  });

  app.whenReady().then(() => {
    app.allowRendererProcessReuse = false;

    createMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}
