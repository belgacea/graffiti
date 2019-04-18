const _ = require('lodash')
const fs = require('fs');
const { ipcMain } = require('electron');
const Util = require('../common/Util');
const Database = require('../main/Database');
const IpcEvents = require('../common/Constants').IpcEvents;
const Analytics = require('../common/Analytics');

ipcMain.on(IpcEvents.Background.ScreenshotStartAll, (event, config) => {
  backgroundWindow.webContents.send(IpcEvents.Background.ScreenshotStartAll, config);
});

ipcMain.on(IpcEvents.Startup.IsFirstStart, (event, obj) => {
  if (fs.existsSync(appSettings.DatabasePath)) {
      Database.checkIsFirstStart().then(isFirstStart => {
        mainWindow.webContents.send(IpcEvents.Startup.IsFirstStart, isFirstStart);
      });
  }
  else {
    mainWindow.webContents.send(IpcEvents.Startup.IsFirstStart, true);
  }
});

ipcMain.on(IpcEvents.Startup.FirstStart.BeginIndexing, (event, config) => {
  Database.createOrOpen(config);
  Database.insert(config);
  
  backgroundWindow.webContents.send(IpcEvents.Background.FirstStart.BeginIndexing, config);
});

ipcMain.on(IpcEvents.Playback.Play, (event, video) => {
  console.log('playing', video.path)

  fs.exists(video.path, exists => {
    if (!exists) {
      mainWindow.webContents.send(IpcEvents.Toast.Error, "The video doesn't exist.");
    }
    else {
      mainWindow.webContents.send(IpcEvents.Toast.Info, 'Playing video...');
      // var spawn = require('child_process').spawn;
      // var vlc = spawn('vlc');
      // vlc.on('exit', function(code){
      // console.log('Exit code: ' + code); 
      // //EXIT TEST HERE
      // });
    
      const exec = require('child_process').exec;
    
      // play wwith default player
      exec('"' + video.path + '"', (err, stdout) => {
        if (err) {
          throw err;
        }
        console.log(stdout)
      });
      
      // TODO find vlc
      // const playerPath = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
      // exec('"' + playerPath + '" "' + video.path + '"', (err, stdout) => {
      //   if (err) {
      //     // throw err;
      //   }
      //   // console.log(stdout)
      // });
    }
  })
  Analytics.events.VIDEO_PLAY();
});

ipcMain.on(IpcEvents.Video.OpenContainingFolder, (event, path) => {
  fs.exists(path, exists => {
    if (!exists) {
      mainWindow.webContents.send(IpcEvents.Toast.Error, "The video doesn't exist.");
    }
    else {
      mainWindow.webContents.send(IpcEvents.Toast.Info, 'Opening folder...');
      const exec = require('child_process').exec;
      const command = 'explorer.exe /select, ' + '\"' + path + '\"';
      console.log('command:', command)
      exec(command, (err, stdout) => {
        if (err) {
          // console.error(err)
          // throw err;
        }
        console.log(stdout)
      });
    }
  });
  Analytics.events.VIDEO_OPEN_CONTAINING_FOLDER();
});

ipcMain.on(IpcEvents.Video.Explorer, (event, path) => {
  fs.exists(path, exists => {
    if (!exists) {
      mainWindow.webContents.send(IpcEvents.Toast.Error, "The path doesn't exist.");
    }
    else {
      mainWindow.webContents.send(IpcEvents.Toast.Info, 'Opening ' + path);
      const exec = require('child_process').exec;
      const command = 'explorer.exe ' + '\"' + path + '\"';
      console.log('command:', command)
      exec(command, (err, stdout) => {
        if (err) {
          // console.error(err)
          // throw err;
        }
        console.log(stdout)
      });
    }
  });
  Analytics.events.VIDEO_EXPLORE_FOLDER();
});

ipcMain.on(IpcEvents.Background.ScreenshotsOneVideo, (event, video) => {
  backgroundWindow.webContents.send(IpcEvents.Background.ScreenshotsOneVideo, video);
  Analytics.events.VIDEO_MAKE_SCREENSHOTS();
});

ipcMain.on(IpcEvents.Background.MatchPerson, (event, person) => {
  backgroundWindow.webContents.send(IpcEvents.Background.MatchPerson, person);
});

ipcMain.on(IpcEvents.Background.DeletePerson, (event, person) => {
  backgroundWindow.webContents.send(IpcEvents.Background.DeletePerson, person);
});

ipcMain.on(IpcEvents.Background.Duplicates.Start, (event) => {
  backgroundWindow.webContents.send(IpcEvents.Background.Duplicates.Start);
  Analytics.events.DUPLICATES_START();
});

ipcMain.on(IpcEvents.Background.CleanUp.Start, (event) => {
  backgroundWindow.webContents.send(IpcEvents.Background.CleanUp.Start);
  Analytics.events.CLEAN_UP_START();
});
