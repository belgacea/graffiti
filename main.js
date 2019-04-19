const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = require('electron');
const Path = require('path')
const url = require('url')
const electron = require('electron')
const dialog = electron.dialog
const fs = require('fs');
const Helper = require('./src/common/Helper');
const Analytics = require('./src/common/Analytics');
const IpcEvents = require('./src/common/Constants').IpcEvents
const { autoUpdater } = require('electron-updater');
const config = require('./config.dev.json');

const workspace = Path.join(app.getPath('userData'), 'workspace');

/*DO NOT REMOVE BELOW */
const IpcHandlers = require('./src/main/IpcHandlers')
const IpcHandlersDatabase = require('./src/main/IpcHandlersDatabase')
const Database = require('./src/main/Database')
/*DO NOT REMOVE ABOVE */
const menuDevTemplate = [
  {
    label: 'BackgroundWindow',
    click() {
      backgroundWindow.show();
      backgroundWindow.webContents.openDevTools();
    }
  },
  {
    label: 'DevTools',
    click() {
      mainWindow.webContents.openDevTools();
    }
  }
];
let closing = false; // for dev: so we actually close the background window

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1000, height: 700, show: true })
  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: Path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  if (Helper.env.isDev() || Helper.env.isUat()) {
    if (Helper.env.isDev()) {
      // Open the DevTools.
      // mainWindow.webContents.openDevTools();
    }

    const mainMenu = Menu.buildFromTemplate(menuDevTemplate);
    Menu.setApplicationMenu(mainMenu);
    // mainWindow.setMenu(null)
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    Analytics.events.APP_CLOSING();
    closing = true;
    mainWindow = null
    if (backgroundWindow) {
      backgroundWindow.close();
      backgroundWindow = null;
    }
  });

  mainWindow.on('app-command', (e, cmd) => {
    // Navigate the window back when the user hits their mouse back button
    if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) {
      mainWindow.webContents.goBack()
    }
  });

  global.mainWindow = mainWindow;
}

var backgroundWindow;
function createBackgroundWindow() {
  // backgroundWindow = new BrowserWindow({width: 1000, height: 700, show: true}); backgroundWindow.maximize();
  backgroundWindow = new BrowserWindow({ show: false });
  backgroundWindow.loadURL(url.format({
    pathname: Path.join(__dirname, 'background.html'),
    protocol: 'file:',
    slashes: true
  }));

  // backgroundWindow.webContents.openDevTools()

  // https://discuss.atom.io/t/how-to-catch-the-event-of-clicking-the-app-windows-close-button-in-electron-app/21425/8
  backgroundWindow.on('close', function (e) {
    if (!closing) {
      backgroundWindow.hide();
      e.preventDefault();
    }
  });

  global.backgroundWindow = backgroundWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  // registerShortcuts(); // c'est au niveau système j'ai l'impression
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace);
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
  if (backgroundWindow === null) {
    createBackgroundWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
if (Helper.env.isDev()) {
  appSettings = config.appSettings;
}
else {
  appSettings = {
    ThumbnailFolder: Path.join(workspace, '/thumbnails'),
    PictureFolder: Path.join(workspace, '/pictures'),
    DatabasePath: Path.join(workspace, 'graffiti-db.grf'),
    ErrorLogPath: Path.join(workspace, 'errorlog.grf')
  };
}

// console.log('app.getPath ...')
// console.log('home', app.getPath('home'));
// console.log('appData', app.getPath('appData'));
// console.log('userData', app.getPath('userData'));
// console.log('temp', app.getPath('temp'));
// console.log('exe', app.getPath('exe'));
// console.log('module', app.getPath('module'));
// console.log('desktop', app.getPath('desktop'));
// console.log('documents', app.getPath('documents'));
// console.log('downloads', app.getPath('downloads'));
// console.log('music', app.getPath('music'));
// console.log('pictures', app.getPath('pictures'));
// console.log('videos', app.getPath('videos'));
// console.log('...app.getPath')

dbExists = fs.existsSync(appSettings.DatabasePath);
if (dbExists) {
  Database.createOrOpen();
}

ipcMain.on(IpcEvents.Startup.Ready, (event) => {
  createBackgroundWindow();
});
// TODO move ipcMain.on to IpcHandler
ipcMain.on(IpcEvents.Background.Ready, (event) => {
  if (dbExists) {
    Database.loadSettings().then((settings) => {
      console.log('starting background tasks')
      backgroundWindow.webContents.send(IpcEvents.Background.Start, settings);
    });
  }
  // backgroundWindow.webContents.send(IpcEvents.Background.Test, 'from main.js');
});

exports.selectDirectory = (callback) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, callback)
}

function registerShortcuts() {
  // https://electronjs.org/docs/tutorial/keyboard-shortcuts#raccourcis-dans-un-browserwindow
  globalShortcut.register('CommandOrControl+F', () => {
    console.log('CommandOrControl+F is pressed')
  })
}

global.userDataPath = app.getPath('userData');
Analytics.init(app.getPath('userData'), `${process.platform} ${require('os').release()}`);

function sendStatusToWindow(text) {
  // win.webContents.send('message', text);
  console.log('AUTOUPDATE:', text)
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded');
// });
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) autoUpdater.quitAndInstall()
  })
})


if (Helper.env.isProd()) {
  app.on('ready', function () {
    console.log('checking for updates in 2 sec')
    setTimeout(() => {
      console.log('checking for updates')
      autoUpdater.checkForUpdatesAndNotify();
    }, 2000)
  });
  /*
  const { crashReporter } = require('electron')
  crashReporter.start({
    productName: '',
    companyName: '',
    submitURL: '',
    uploadToServer: true,
    extra: {
      userid: Analytics.getUserId(app.getPath('userData')),
      version: Helper.app.version()
    }
  })
  */
}

// console.log('last crash:')
// console.log(crashReporter.getLastCrashReport())

// setTimeout(() => {
//   console.error('throwing error')
//   // throw new Error('Backtrace CrashReporter test');
//   // process.crash();
// }, 10000)