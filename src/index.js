const {
	app,
	BrowserWindow,
	shell,
	Menu
} = require("electron");
const path = require("path");
const fs = require('fs');
const https = require('https');
const gotTheLock = app.requestSingleInstanceLock();

let APP_NAME = "Colony Player";
let win;

if (!gotTheLock) {
	app.quit();
} else {
	const createMenu = () => {
		const template = [{
				role: "reload"
			},
			{
				role: "forceReload"
			},
			{
				role: "toggleDevTools"
			},
			{
				type: "separator"
			},
			{
				role: "resetZoom"
			},
			{
				role: "zoomIn"
			},
			{
				role: "zoomOut"
			},
			{
				type: "separator"
			},
			{
				role: "togglefullscreen"
			},
		];

		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	};

	const setupFlashPlugin = () => {
		let pluginPath;
		const pluginVersion = '32.0.0.371';

		// Get the base path depending on whether the app is packaged
		const basePath = app.isPackaged ?
			path.join(process.resourcesPath, 'plugins') :
			path.join(__dirname, 'plugins');

		// Determine platform-specific paths
		switch (process.platform) {
			case 'win32':
				const winArch = process.arch === 'x64' ? 'x64' : 'ia32';
				pluginPath = path.join(basePath, 'win', winArch, 'pepflashplayer.dll');
				break;
			case 'darwin':
				pluginPath = path.join(basePath, 'mac', 'PepperFlashPlayer.plugin');
				break;
			case 'linux':
				const linuxArch = process.arch === 'x64' ? 'x64' : 'ia32';
				pluginPath = path.join(basePath, 'linux', linuxArch, 'libpepflashplayer.so');
				break;
			default:
				console.error('Unsupported platform:', process.platform);
				return;
		}

		console.log('App is packaged:', app.isPackaged);
		console.log('Base path:', basePath);
		console.log('Platform:', process.platform);
		console.log('Architecture:', process.arch);
		console.log('Flash plugin path:', pluginPath);
		console.log('Plugin exists:', fs.existsSync(pluginPath));

		if (!fs.existsSync(pluginPath)) {
			console.error('Flash plugin not found at:', pluginPath);
			return;
		}

		// Platform-specific switches
		app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
		app.commandLine.appendSwitch('ppapi-flash-version', pluginVersion);
		app.commandLine.appendSwitch('no-sandbox');
		app.commandLine.appendSwitch('enable-plugins');
		app.commandLine.appendSwitch('allow-outdated-plugins');

		// Platform-specific configurations
		if (process.platform === 'win32') {
			app.commandLine.appendSwitch('disable-gpu');
			app.commandLine.appendSwitch('disable-gpu-compositing');
		}

		if (process.platform === 'linux') {
			app.commandLine.appendSwitch('ignore-gpu-blacklist');
			app.commandLine.appendSwitch('enable-gpu-rasterization');
		}
	};

	const checkForSWFUpdate = (localPath, remoteUrl) => {
		return new Promise((resolve, reject) => {
			https.get(remoteUrl, { method: 'HEAD' }, (response) => {
				if (response.statusCode !== 200) {
					reject(new Error(`Failed to check remote file: ${response.statusCode}`));
					return;
				}

				const remoteSize = parseInt(response.headers['content-length']);
				const remoteLastModified = response.headers['last-modified'] ? new Date(response.headers['last-modified']) : null;
				
				if (!fs.existsSync(localPath)) {
					console.log('Local SWF not found, need to download');
					resolve(true);
					return;
				}
				
				const localStats = fs.statSync(localPath);
				const localSize = localStats.size;
				const localLastModified = localStats.mtime;
				
				console.log('Local SWF size:', localSize, 'bytes');
				console.log('Remote SWF size:', remoteSize, 'bytes');
				console.log('Local last modified:', localLastModified.toISOString());
				if (remoteLastModified && !isNaN(remoteLastModified.getTime())) {
					console.log('Remote last modified:', remoteLastModified.toISOString());
				} else {
					console.log('Remote last modified: not available or invalid');
				}
				
				// Check if update is needed (different size or newer remote file if date is available)
				const needsUpdate = localSize !== remoteSize || 
					(remoteLastModified && !isNaN(remoteLastModified.getTime()) && remoteLastModified > localLastModified);
				
				if (needsUpdate) {
					console.log('SWF update available, will download new version');
				} else {
					console.log('Local SWF is up to date');
				}
				
				resolve(needsUpdate);
			}).on('error', reject);
		});
	};

	const downloadSWF = () => {
		const swfUrl = 'https://raw.githubusercontent.com/SynthKittenDev/Colony-Revival-Project/main/ColonyV63.swf';
		const localPath = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'static', 'ColonyV63.swf');

		return checkForSWFUpdate(localPath, swfUrl)
			.then(needsUpdate => {
				if (!needsUpdate) {
					return Promise.resolve(localPath);
				}
				
				console.log('Downloading SWF update...');
				return new Promise((resolve, reject) => {
					https.get(swfUrl, (response) => {
						if (response.statusCode !== 200) {
							reject(new Error(`Failed to download: ${response.statusCode}`));
							return;
						}

						const file = fs.createWriteStream(localPath);
						response.pipe(file);
						file.on('finish', () => {
							file.close();
							console.log('SWF downloaded successfully');
							resolve(localPath);
						});
					}).on('error', reject);
				});
			})
			.catch(err => {
				console.warn('Failed to check for SWF updates, using local version if available:', err.message);
				if (fs.existsSync(localPath)) {
					return Promise.resolve(localPath);
				} else {
					return Promise.reject(new Error('No local SWF available and update check failed'));
				}
			});
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
				webSecurity: true,
				allowRunningInsecureContent: true,
				enableRemoteModule: true,
				backgroundThrottling: false,
				pluginCreationParameters: {
					enableAsynchronousInProcess: true
				}
			}
		});

		if (!app.isPackaged) {
			win.webContents.openDevTools(); // Open developer tools for debugging
		}

		win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
			const headers = {
				...details.responseHeaders
			};

			if (headers['set-cookie']) {
				headers['set-cookie'] = headers['set-cookie'].map(cookie => {
					if (!cookie.includes('SameSite=')) {
						cookie = cookie + '; SameSite=None; Secure';
					} else {
						cookie = cookie.replace(/SameSite=\w+/i, 'SameSite=None');
						if (!cookie.includes('Secure')) {
							cookie = cookie + '; Secure';
						}
					}
					return cookie;
				});
			}

			callback({
				cancel: false,
				responseHeaders: headers
			});
		});

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

		const localSwfPath = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'static', 'ColonyV63.swf');
		const swfUrl = fs.existsSync(localSwfPath) ?
			`file://${localSwfPath}` :
			'https://raw.githubusercontent.com/SynthKittenDev/Colony-Revival-Project/main/ColonyV63.swf';

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
        <div id="flashContent">
            <embed 
                type="application/x-shockwave-flash"
                src="${swfUrl}"
                width="100%"
                height="100%"
                quality="high"
                bgcolor="#000000"
                play="true"
                loop="true"
                wmode="direct"
                allowscriptaccess="always"
                allowfullscreen="true"
            />
        </div>
        <script>
          window.onload = function() {
            console.log('Flash plugins:', navigator.plugins);
            console.log('Flash enabled:', navigator.plugins['Shockwave Flash']);
            for (let i = 0; i < navigator.plugins.length; i++) {
              console.log('Plugin:', navigator.plugins[i].name);
            }
          };
        </script>
    </body>
    </html>
    `;

		const tempHtmlPath = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'temp.html');
		fs.writeFileSync(tempHtmlPath, htmlContent);

		win.loadFile(tempHtmlPath);
		win.center();
		win.on('closed', () => {
			win = null; // Set the window object to null to avoid memory leaks
		});

		win.once("page-title-updated", function(event) {
			event.preventDefault();
			if (win && !win.isDestroyed()) {
				win.title = APP_NAME;
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
		if (process.platform !== "darwin") app.quit();
	});

	setupFlashPlugin();

	app.whenReady().then(async () => {
		app.allowRendererProcessReuse = false;

		try {
			const localSwfPath = await downloadSWF();
			console.log('Local SWF path:', localSwfPath);
		} catch (err) {
			console.error('Failed to download SWF:', err);
		}

		createMenu();
		createWindow();

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});
}
