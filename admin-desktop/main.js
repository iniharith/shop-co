const { app, BrowserWindow, WebContentsView, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  const splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.png'),
  });
  splashWindow.loadFile('splash.html');

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000', // solid black to prevent transparent window bugs
      symbolColor: '#ffffff', // white icons
      height: 32
    },
    backgroundColor: '#000000', // Force opaque background so CSS backdrop-filter works!
    show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the website directly into the main window to support WCO
  mainWindow.loadURL('https://admin.kampungcetak.com');
  
  // Inject CSS so content isn't hidden under the title bar
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      [data-sidebar="sidebar"] { margin-top: 32px !important; height: calc(100svh - 32px) !important; }
      header { margin-top: 32px !important; }
      div.bg-white:has(> img[alt="Kampung Cetak"]) {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      #electron-drag-region {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 32px;
        background: transparent;
        -webkit-app-region: drag;
        z-index: 999999;
      }
    `);
    
    mainWindow.webContents.executeJavaScript(`
      if (!document.getElementById('electron-drag-region')) {
        const dragDiv = document.createElement('div');
        dragDiv.id = 'electron-drag-region';
        document.body.appendChild(dragDiv);
      }
    `);
    
    // Force a small delay to ensure rendering before showing
    setTimeout(() => {
      splashWindow.close();
      mainWindow.show();
      mainWindow.maximize();
    }, 1500); 
  });

  // Function to handle resize if needed
  const updateViewBounds = () => {
    // No child views to resize anymore
  };

  // Set initial bounds and update on resize
  updateViewBounds();
  mainWindow.on('resize', updateViewBounds);

  // IPC Handlers for custom window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  // Removed maximize here to prevent issues before show
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
