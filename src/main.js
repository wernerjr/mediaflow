const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const { ExifTool } = require('exiftool-vendored');
const fs = require('fs/promises');
const fsSync = require('fs');
const FileOrganizer = require('./modules/fileOrganizer');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let exiftool;
let fileOrganizer;

// Initialize ExifTool
function initExifTool() {
  const exiftoolPath = app.isPackaged
    ? path.join(process.resourcesPath, 'exiftool.exe')
    : path.join(__dirname, '..', 'node_modules', 'exiftool-vendored.exe', 'bin', 'exiftool.exe');

  exiftool = new ExifTool({ exiftoolPath });
  fileOrganizer = new FileOrganizer();
}

const createWindow = () => {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Calculate initial window size (80% of screen size, respecting max dimensions)
  const windowWidth = Math.min(1440, Math.max(1024, Math.floor(width * 0.8)));
  const windowHeight = Math.min(1080, Math.max(768, Math.floor(height * 0.8)));

  // Create the browser window with responsive dimensions
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1024,
    minHeight: 768,
    maxWidth: 1440,
    maxHeight: 1080,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    show: false,
    backgroundColor: '#ffffff',
  });

  // Center the window
  mainWindow.center();

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

app.whenReady().then(() => {
  initExifTool();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for folder selection
ipcMain.handle('select-directory', async (event, type) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return {
    success: !result.canceled,
    path: result.canceled ? null : result.filePaths[0]
  };
});

// IPC handler for reading EXIF data
ipcMain.handle('read-exif', async (event, filePath) => {
  try {
    return await exiftool.read(filePath);
  } catch (error) {
    console.error('Error reading EXIF:', error);
    return null;
  }
});

// Handler para carregar imagem
ipcMain.handle('load-image', async (event, imagePath) => {
  try {
    const result = await fileOrganizer.loadImage(imagePath);
    if (result.success) {
      return {
        success: true,
        path: imagePath,
        isHeic: result.isHeic,
        base64: result.base64
      };
    }
    return {
      success: false,
      error: result.error
    };
  } catch (error) {
    console.error('Error accessing image:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handler para converter HEIC para JPEG
ipcMain.handle('convert-heic', async (event, imagePath) => {
    try {
        // Lê o arquivo HEIC
        const inputBuffer = await fs.readFile(imagePath);
        
        // Converte para JPEG
        const outputBuffer = await heicConvert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: 1
        });
        
        return {
            success: true,
            data: outputBuffer.toString('base64')
        };
    } catch (error) {
        console.error('Error converting HEIC:', error);
        return {
            success: false,
            error: error.message
        };
    }
}); 