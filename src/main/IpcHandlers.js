const _ = require('lodash')
const fs = require('fs');
const { ipcMain } = require('electron');
const Util = require('../common/Util');
const Database = require('../main/Database');
const IpcEvents = require('../common/Constants').IpcEvents;
const Analytics = require('../common/Analytics');

const sendToBackgroundWindow = (eventName, payload) => {
  backgroundWindow.webContents.send(eventName, payload);
};

const sendToMainWindow = (eventName, payload) => {
  mainWindow.webContents.send(eventName, payload);
};

const playVideo = (video) => {
  console.log('playing', video.path);

  fs.exists(video.path, exists => {
    if (!exists) {
      sendToMainWindow(IpcEvents.Toast.Error, "The video doesn't exist.");
    } else {
      sendToMainWindow(IpcEvents.Toast.Info, 'Playing video...');
      // var spawn = require('child_process').spawn;
      // var vlc = spawn('vlc');
      // vlc.on('exit', function(code){
      // console.log('Exit code: ' + code);
      // //EXIT TEST HERE
      // });
      const exec = require('child_process').exec;
      // play with default player
      exec('"' + video.path + '"', (err, stdout) => {
        if (err) {
          throw err;
        }
        console.log(stdout);
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
  });
  Analytics.events.VIDEO_PLAY();
};

const openContainingFolder = (path) => {
  fs.exists(path, exists => {
    if (!exists) {
      sendToMainWindow(IpcEvents.Toast.Error, "The video doesn't exist.");
    } else {
      sendToMainWindow(IpcEvents.Toast.Info, 'Opening folder...');
      const exec = require('child_process').exec;
      const command = 'explorer.exe /select, ' + '\"' + path + '\"';
      console.log('command:', command);
      exec(command, (err, stdout) => {
        if (err) {
          // console.error(err)
          // throw err;
        }
        console.log(stdout);
      });
    }
  });
  Analytics.events.VIDEO_OPEN_CONTAINING_FOLDER();
};

const exploreFolder = (path) => {
  fs.exists(path, exists => {
    if (!exists) {
      sendToMainWindow(IpcEvents.Toast.Error, "The path doesn't exist.");
    } else {
      sendToMainWindow(IpcEvents.Toast.Info, 'Opening ' + path);
      const exec = require('child_process').exec;
      const command = 'explorer.exe ' + '\"' + path + '\"';
      console.log('command:', command);
      exec(command, (err, stdout) => {
        if (err) {
          // console.error(err)
          // throw err;
        }
        console.log(stdout);
      });
    }
  });
  Analytics.events.VIDEO_EXPLORE_FOLDER();
};

ipcMain.on(IpcEvents.Background.ScreenshotStartAll, (event, config) => {
  sendToBackgroundWindow(IpcEvents.Background.ScreenshotStartAll, config);
});

ipcMain.on(IpcEvents.Startup.IsFirstStart, (event, obj) => {
  if (fs.existsSync(appSettings.DatabasePath)) {
    Database.checkIsFirstStart()
        .then(isFirstStart => {
          sendToMainWindow(IpcEvents.Startup.IsFirstStart, isFirstStart);
        });
  } else {
    sendToMainWindow(IpcEvents.Startup.IsFirstStart, true);
  }
});

ipcMain.on(IpcEvents.Startup.FirstStart.BeginIndexing, (event, config) => {
  Database.createOrOpen(config);
  Database.insert(config);

  sendToBackgroundWindow(IpcEvents.Background.FirstStart.BeginIndexing, config);
});

ipcMain.on(IpcEvents.Playback.Play, (event, video) => {
  playVideo(video);
});

ipcMain.on(IpcEvents.Video.OpenContainingFolder, (event, path) => {
  openContainingFolder(path);
});

ipcMain.on(IpcEvents.Video.Explorer, (event, path) => {
  exploreFolder(path);
});

ipcMain.on(IpcEvents.Background.ScreenshotsOneVideo, (event, video) => {
  sendToBackgroundWindow(IpcEvents.Background.ScreenshotsOneVideo, video);
  Analytics.events.VIDEO_MAKE_SCREENSHOTS();
});

ipcMain.on(IpcEvents.Background.MatchPerson, (event, person) => {
  sendToBackgroundWindow(IpcEvents.Background.MatchPerson, person);
});

ipcMain.on(IpcEvents.Background.DeletePerson, (event, person) => {
  sendToBackgroundWindow(IpcEvents.Background.DeletePerson, person);
});

ipcMain.on(IpcEvents.Background.Duplicates.Start, (event) => {
  sendToBackgroundWindow(IpcEvents.Background.Duplicates.Start);
  Analytics.events.DUPLICATES_START();
});

ipcMain.on(IpcEvents.Background.CleanUp.Start, (event) => {
  sendToBackgroundWindow(IpcEvents.Background.CleanUp.Start);
  Analytics.events.CLEAN_UP_START();
});

ipcMain.on(IpcEvents.Background.ApplyRule, (event, rule) => {
  sendToBackgroundWindow(IpcEvents.Background.ApplyRule, rule);
});