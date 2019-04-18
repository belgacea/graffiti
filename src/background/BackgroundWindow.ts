import * as fs from 'fs'
import * as _ from 'lodash'
declare function require(name: string);
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;

const Logger = require('../main/Logger');

import {IpcEvents} from '../common/Constants';

import ScreenshotEngine from './ScreenshotEngine';
import Watcher from './Watcher';
import Indexer from './Indexer';
import Persistence from '../core/Persistence';
import Person from '../types/Person';
import VideoStore from '../store/VideoStore';
import AppSettings from '../types/AppSettings';
import Video from '../types/Video';
import * as Analytics from '../common/Analytics';

console.log('in BackgroundWindow.js')

const mainWindow = remote.getGlobal('mainWindow');

exports.init = function () {
    Persistence.init();

    ipcRenderer.on(IpcEvents.Background.Start, onStart);
    ipcRenderer.on(IpcEvents.Background.ScreenshotsOneVideo, onScreenshotsOneVideo);
    ipcRenderer.on(IpcEvents.Background.MatchPerson, onMatchPersonToVideos);
    ipcRenderer.on(IpcEvents.Background.FirstStart.BeginIndexing, onFirstStartBeginIndexing)
    ipcRenderer.on(IpcEvents.Background.ScreenshotStartAll, onScreenshotStartAll)
    ipcRenderer.on(IpcEvents.Background.DeletePerson, onDeletePerson);
    ipcRenderer.on(IpcEvents.Background.Duplicates.Start, onStartDuplicates);
    ipcRenderer.on(IpcEvents.Background.CleanUp.Start, onStartCleanUp);

    console.log('Will start background tasks in 1 minute...')
    setTimeout(() => {
        console.warn('delete events IpcEvents.Background.Ready and IpcEvents.Background.Start');
        ipcRenderer.send(IpcEvents.Background.Ready);
    }, 1000 * 60); // wait 1 minute before starting the tasks
}

function onFirstStartBeginIndexing(event, config: AppSettings) {
    const handleProgress = (progress) => {
        mainWindow.webContents.send(IpcEvents.Startup.FirstStart.Progress, progress);
    };
    const handleFinish = () => {
        mainWindow.webContents.send(IpcEvents.Startup.FirstStart.FinishedIndexing);
    };
    Indexer.firstStartIndexing(config, handleProgress, handleFinish);
}

function onScreenshotStartAll(event, config: AppSettings) {
    const handleScreenshotsFinished = videos => {
        mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, videos);
    }
    ScreenshotEngine.startMakingMissingScreenshot(config.BackgroundParallelScreenshot, null, handleScreenshotsFinished);
}

function onStart(event, settings: AppSettings) {
    const dbExists = remote.getGlobal('dbExists');
    const appSettings: AppSettings = remote.getGlobal('appSettings'); // TODO: choose only one: this one or from arguments

    // remove when ScreenshotEngine is a queue
    let crawlFinished = false; // tell the screenshot engine to start again for new videos
    let screenshotsFinished = false; // tell the crawl engine to start again for new videos

    Logger.init(appSettings.ErrorLogPath);

    // Start missing thumbnail generation
    const handleOneScreenshotDone = video => {
        // mainWindow.webContents.send(IpcEvents.Video.ReplaceOne, video);
    }
    if (settings && settings.StartScreenshotOnStartup) {
        const handleScreenshotsFinishedSecondPass = (videos) => {
            mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, videos);
        }
        const handleScreenshotsFinished = (videos) => {
            mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, videos);

            if (crawlFinished) {
                console.log('starting screenshots after crawl...')
                ScreenshotEngine.startMakingMissingScreenshot(settings.BackgroundParallelScreenshot, handleOneScreenshotDone, handleScreenshotsFinishedSecondPass);
            }
            else {
                screenshotsFinished = true;
            }
        };
        ScreenshotEngine.startMakingMissingScreenshot(settings.BackgroundParallelScreenshot, handleOneScreenshotDone, handleScreenshotsFinished);
    }
    else {
        console.log('Screenshots generation on startup disbled')
    }

    const autoRefreshFolders = _.filter(settings.WatchedFolders, f => f.autoRefresh);
    if (settings && autoRefreshFolders.length > 0) {
        console.log('Crawl on startup enabled for some. Starting...')
        const handleFinished = (newVideos, modVideos) => {
            mainWindow.webContents.send(IpcEvents.Video.AddedMultiple, newVideos);
            mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, modVideos);
            if (screenshotsFinished) {
                console.log('starting screenshots after crawl...')
                ScreenshotEngine.startMakingMissingScreenshot(settings.BackgroundParallelScreenshot, handleOneScreenshotDone)
            }
            else {
                crawlFinished = true;
            }
        }
        Indexer.lookForNewVideos(autoRefreshFolders.map(f => f.path), handleFinished);
    }
    else {
        console.log('Crawl on startup disabled')
    }

    // TODO TEST: duplication risk (lookForNewVideos add the video, and Watcher detects it)
    if (settings && settings.IsWatcherEnabled) {
        console.log('Watcher enabled. Starting...')

        startWatcher(settings.WatchedFolders.map(f => f.path))
    }
    else {
        console.log('Watcher disabled')
    }
}

function startWatcher(folders: string[]) {
    console.warn('TODO: déplacer les handlers en dehors de la fonction ?')
    const handledInserted = video => mainWindow.webContents.send(IpcEvents.Video.Added, video);
    const handleModified = video => mainWindow.webContents.send(IpcEvents.Video.ReplaceOne, video);
    const handleAdd = path => Indexer.addFile(path, handledInserted, handleModified);
    const handleChange = path => Logger.message('watcher-change: ' + path);

    console.warn('Ensure that there are no duplicates paths watched')
    let watcher = new Watcher();
    watcher.onNew = handleAdd;
    watcher.onChanged = handleChange;
    watcher.watchFolder(folders);
}

function onScreenshotsOneVideo(event, video: Video) {
    console.log('BackgroundWindow.onScreenshotsOneVideo')
    ScreenshotEngine.makeScreenshots(video, (errors, videoScreenshot) => {
        if (errors) {
            // TODO: toast
            console.warn('TODO: toast message: there were', errors.length, 'errors')
        }
        else {
            new Persistence().setFields(video._id, { screenshots: videoScreenshot.screenshots }).then(() => {
                mainWindow.webContents.send(IpcEvents.Screenshot.CreatedVideo, video);
            });
        }
    });
}

function onMatchPersonToVideos(event, person: Person) {
    const db = new Persistence();
    db.getAll('video').then(videos => {
        const withPerson = Indexer.matchPerson(videos, person);
        db.updateAll(withPerson).then(() => {
            console.warn('TODO: n\'envoyer que les ids')
            mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, withPerson);
        });
    });
}

function onDeletePerson(event, person: Person) {
    const db = new Persistence();
    db.getAll('video').then(videos => {
        videos = new VideoStore(videos).getAllByPersonId(person._id);
        const withoutPerson = Indexer.removePerson(videos, person);
        db.updateAll(withoutPerson)
        .then(() => {
            console.warn('TODO: n\'envoyer que les ids')
            mainWindow.webContents.send(IpcEvents.Video.ReplaceMultiple, withoutPerson);

            db.remove(person._id).then(numRemoved => {
                fs.unlink(person.photo, (err) => {
                    if (err) {
                        mainWindow.webContents.send(IpcEvents.Toast.Error, 'Could not delete the photo for ' + person.name);
                    }
                });
                mainWindow.webContents.send(IpcEvents.Person.Deleted, person);
            })
        }).catch((err) => {
            console.error(err)
        });
    });
}

function onStartDuplicates(event) {
    const handleProgress = (progress) => {
        mainWindow.webContents.send(IpcEvents.Background.Duplicates.Progress, progress);
    };

    new Persistence().getAll('video').then(videos => {
        Indexer.findDuplicates(videos, handleProgress).then(duplicates => {
            mainWindow.webContents.send(IpcEvents.Background.Duplicates.Result, duplicates);
            Analytics.events.DUPLICATES_FINISHED();
        });
    });
}

function onStartCleanUp(event) {
    const handleProgress = (progress) => {
        mainWindow.webContents.send(IpcEvents.Background.CleanUp.Progress, progress);
    };
    new Persistence().getAll('video').then(videos => {
        Indexer.doCleanUp(videos, handleProgress).then(result => {
            mainWindow.webContents.send(IpcEvents.Background.CleanUp.Result, result);
        });
    });
}