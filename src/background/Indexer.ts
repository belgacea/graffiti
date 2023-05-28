import * as _ from 'lodash'
import * as fs from 'fs'
import * as async from 'async'
import Video from '../types/Video';
import Person from '../types/Person';
const os = require('electron').remote.require('os');
const Util = require('../common/Util');
const Logger = require('../main/Logger');
import ScreenshotEngine from './ScreenshotEngine';
import Persistence from '../core/Persistence';
import AppSettings from '../types/AppSettings';
import Crawler from './Crawler';
import { DuplicateGroup, CleanUpResult } from '../types/MaintenanceTypes';

export default class Indexer {
    public static matchPerson(videos: Video[], person: Person): Video[] {
        if (!person.autoMatch)
            return [];

        const middleSeparator = '[ ._-]+';
        const endSeparator = '[, ._-]*';
        let words = person.name.toLowerCase().split(' ');
        let pattern = words[0];

        for (let i = 1; i < words.length; i++) {
            pattern = pattern + middleSeparator + words[i];
        }
        pattern = pattern + endSeparator;

        const regEx1 = new RegExp(pattern);
        const regEx2 = new RegExp(person.name.toLowerCase().replace(/ /g, ''));
        // console.log('name: %s, pattern: %q', person.name, pattern)

        let matched: Video[] = [];
        _.each(videos, video => {
            if (video.path.toLowerCase().match(regEx1) || video.path.toLowerCase().match(regEx2)) {
                video.people = video.people || [];
                if (video.people.indexOf(person._id) < 0) {
                    video.people.push(person._id);
                    matched.push(video);
                }
            }
        });

        return matched;
    }

    public static removePerson(videos: Video[], person: Person) {
        _.each(videos, video => {
            _.remove(video.people, p => p === person._id);
        });
        return videos;
    }

    public static firstStartIndexing(config: AppSettings, callbackProgress, callbackFinished) {
        if (!fs.existsSync(config.ThumbnailFolder)) {
            fs.mkdirSync(config.ThumbnailFolder);
        }
        console.log('in firstStartIndexing')
        new Crawler([config.ThumbnailFolder]).getVideosAsync(config.WatchedFolders.map(f => f.path))
            .catch(reason => {
                console.error('Error promise', reason)
            })
            .then((videos: Video[]) => {
                console.log('Indexing', videos.length, 'videos...');

                let asyncFunctions = [];
                var progressCount = 0;

                _.times(videos.length, (num) => {
                    asyncFunctions.push(function (callback) {
                        console.log('initializeVideo', videos[num].path)
                        Indexer.initializeVideo(videos[num], (initVid) => {
                            progressCount++;
                            let progress = Math.trunc((progressCount / videos.length) * 100);
                            if (initVid) {
                                console.log('initializeVideo', initVid.path, 'OK')
                                new Persistence().insert(initVid).then(() => {
                                    callbackProgress(progress);
                                    callback(null);
                                });
                            }
                            else {
                                callbackProgress(progress);
                                callback(null);
                            }
                        })
                    })
                });

                let cpuCount = os.cpus().length;
                async.parallelLimit(asyncFunctions, cpuCount, (err, result) => {
                    callbackFinished();
                });
            });
    }

    public static lookForNewVideos(folders: string[], callbackFinished) {
        const db = new Persistence();
        db.getAll('video').then(currentVideos => {
            db.getAll('person').then(currentPeople => {
                db.getSettings().then(settings => {
                    new Crawler([settings.ThumbnailFolder]).getVideosAsync(folders)
                        .catch(reason => {
                            console.error('lookForNewVideos caught a promise error from Crawler.getVideosAsync, reason:', reason)
                        })
                        .then((foundVideos: Video[]) => {
                            console.log('Crawl: got all videos length:', foundVideos.length);
                            let newVideos = _.differenceBy(foundVideos, currentVideos, 'path');
                            let asyncFunctions = [];

                            _.times(currentPeople.length, idx => {
                                const person = currentPeople[idx];
                                Indexer.matchPerson(newVideos, person);
                            });

                            _.times(newVideos.length, (num) => {
                                const fn = function (callback) {
                                    Indexer.initializeVideo(newVideos[num], (initVid, err) => {
                                        if (initVid) {
                                            if (initVid._id) {
                                                console.log('MOD OK initializeVideo', initVid.path)
                                                callback(null, { mod: initVid });
                                            }
                                            else {
                                                db.insert(initVid).then(newVideo => {
                                                    console.log('NEW OK initializeVideo', initVid.path)
                                                    callback(null, { new: newVideo });
                                                });
                                            }
                                        }
                                        else {
                                            callback(null);
                                        }
                                    })
                                }
                                asyncFunctions.push(async.reflect(fn))
                            });

                            console.log('lookForNewVideos about to run', asyncFunctions.length, 'functions in parallel for', newVideos.length, 'videos');
                            async.parallelLimit(asyncFunctions, os.cpus().length, (err, results: [{ value?, error?}]) => {
                                console.log('finished parallel work')
                                console.log('err:', err)
                                console.log('result:', results)
                                let newVideos = _.filter(results, r => _.has(r.value, 'new')).map(r => r.value.new);
                                let modVideos = _.filter(results, r => _.has(r.value, 'mod')).map(r => r.value.mod);
                                newVideos = _.compact(newVideos); // some results may be undefined
                                modVideos = _.compact(modVideos); // some results may be undefined
                                console.log('newVideos', newVideos)
                                console.log('modVideos', modVideos)
                                console.log('lookForNewVideos finished')
                                callbackFinished(newVideos, modVideos);
                            });
                        });
                });
            });
        });
    }

    /**
     * Sets metadata.
     * Sets one screenshot.
     * Does not save in db.
     * @param {*} video 
     */
    public static initializeVideo(video, callback) {
        const db = new Persistence();
        //console.log('initializeVideo', video.path)
        const returnError = (err) => {
            // console.error('v--------------------------------- ERROR ---------------------------------v');
            if (err) {
                console.error('ERR initializeVideo -> ' + video.path)
                console.error(err);
                Logger.error(err, 'initializeVideo error for ' + video.path)
            }
            else {
                Logger.message('Could not get metadata for ' + video.path);
                console.error('Could not get metadata for ' + video.path)
            }
            // console.error('^--------------------------------- ERROR ---------------------------------^');
            callback(null, err);
        };

        try {
            Util.getMetadata(video.path, (err, metadata) => {
                if (err) {
                    returnError(err);
                }
                else {
                    Util.fillUpMetadata(video, metadata, (err, video) => {
                        if (err) {
                            returnError(err);
                        }
                        else if (video) {
                            db.getBy({ hash: video.hash }).then((videosIdenticalHash: Video[]) => {
                                const inexistantVideos = _.filter(videosIdenticalHash, v => !fs.existsSync(v.path));
                                if (inexistantVideos.length === 1) {
                                    const inexistant = inexistantVideos[0];
                                    db.setFields(inexistant._id, { path: video.path }).then(() => {
                                        inexistant.path = video.path;
                                        callback(inexistant);
                                    });
                                }
                                else {
                                    fs.stat(video.path, (err, stats) => {

                                        if (stats) {
                                            video.fileCreationTime = stats.birthtime;
                                            video.fileModificationTime = stats.mtime;
                                        }

                                        if (err) {
                                            returnError(err);
                                        }
                                        else {
                                            ScreenshotEngine.initScreenshot(video, (err, videoScreenshot) => {
                                                if (err) {
                                                    console.error('ERR initScreenshot', video.path);
                                                    console.error(err);
                                                }
                                                callback(videoScreenshot, err);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            console.error('Indexer.initializeVideo: should not happen')
                            returnError(err);
                        }
                    });
                }
            });
        }
        catch (err) {
            console.error('Caught Error in initializeVideo for', video.path);
            console.error(err);
            Logger.error(err, 'Caught Error in initializeVideo for ' + video.path);
            returnError(err);
        }
    }

    public static addFile(path, callback, callbackModif) {
        let video = Util.createVideo(path); console.warn('TODO: replace with new Video')

        Indexer.initializeVideo(video, initVid => {
            if (initVid) {
                if (!initVid._id) {
                    console.log('addFile', video.path)
                    new Persistence().insert(initVid).then(insertedVideo => {
                        callback(insertedVideo);
                    });
                }
                else {
                    callbackModif(initVid); // the video exists but the path has changed
                }
            }
        });
    }

    public static findDuplicates(videos: Video[], callbackProgress): Promise<Array<DuplicateGroup>> {
        console.log('findDuplicates started')
        return new Promise((resolve, reject) => {

            let dictionnaryDuplicates = [];
            let progressCount = 0;

            _.each(videos, (video) => {
                if (!video.deleted && fs.existsSync(video.path)) {
                    let f = dictionnaryDuplicates[video.hash] || [];
                    f.push(video._id);
                    dictionnaryDuplicates[video.hash] = f;
                }

                progressCount++;
                let progress = Math.trunc((progressCount / videos.length) * 100);
                callbackProgress(progress);
            });

            const groupsByHash: Array<DuplicateGroup> = [];
            _.mapKeys(dictionnaryDuplicates, (videoIds: Array<string>, hash: string) => {
                if (videoIds.length > 1) {
                    let group = new DuplicateGroup(hash);
                    groupsByHash.push(group);
                    group.videoIds = videoIds;
                }
				return null
            })

            console.log('findDuplicates finished. groups:', groupsByHash.length)
            resolve(groupsByHash)
        });
    }

    public static doCleanUp(videos: Video[], callbackProgress): Promise<CleanUpResult> {
        console.log('doCleanUp started')
        return new Promise((resolve, reject) => {
            let progressCount = 0;
            const result = new CleanUpResult();
            _.each(videos, video => {
                const exists = fs.existsSync(video.path);
                if (video.deleted && exists) {
                    result.existingVideosDeletedIds.push(video._id);
                }
                else if (!exists) {
                    result.nonExistingVideoNotDeletedIds.push(video._id);
                }

                progressCount++;
                let progress = Math.trunc((progressCount / videos.length) * 100);
                callbackProgress(progress);
            });

            resolve(result);
        });
    }
}
