const remote = require('electron').remote;
const Path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const moment = require('moment');
require("moment-duration-format");
const Util = require('../common/Util');
const Helper = require('../common/Helper');
import * as fs from 'fs'
import * as _ from 'lodash'
import * as async from 'async'
import Video from "../types/Video";
import Persistence from "../core/Persistence";

const MAX_WIDTH = 250;
const MAX_HEIGHT = 150;
const INIT_INDEX_MAIN_THUMB = 2;

let ffmpegPath = 'ffmpeg';
let ffprobePath = '';
// if (Helper.env.isUat() || Helper.env.isProd()) {
if (!Helper.env.isTest()) {
    // console.log(process.cwd())
    // console.log('__dirname:', __dirname)
    // console.log('__filename:', __filename)
    // console.log(require('ffmpeg-static').path)
    // console.log(require('ffprobe-static').path)
    ffmpegPath = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked\\node_modules\\ffmpeg-static');
    ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked\\node_modules\\ffprobe-static');
    if (Helper.env.isDev()) {
        ffmpegPath = Path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegPath);
        ffprobePath = Path.join(process.cwd(), 'node_modules', 'ffprobe-static', ffprobePath);
    }
    console.log('ffmpegPath:', ffmpegPath)
    console.log('ffprobePath:', ffprobePath)

    ffmpeg.setFfmpegPath(ffmpegPath)
    ffmpeg.setFfprobePath(ffprobePath)
    console.warn('TODO: ffmpeg and ffprobe changed paths are not ideal for other platforms')
}

export default class ScreenshotEngine {

    public static initScreenshot(video, callback) {
        const ratio = ScreenshotEngine.calculateAspectRatioFit(video.width, video.height, MAX_WIDTH, MAX_HEIGHT, video.path);
        const timestamps = ScreenshotEngine.getTimestamps(video.duration);
        const appSettings = remote.getGlobal('appSettings');

        video.screenshotPrefix = Util.uuid();
        video.screenshotsFolder = Path.join(appSettings.ThumbnailFolder, video.screenshotPrefix);
        video.screenshots = [];
        _.times(timestamps.length, (num) => {
            video.screenshots.push({
                timestamp: timestamps[num]
            });
        });

        ScreenshotEngine.makeOneScreenshot(video, ratio, INIT_INDEX_MAIN_THUMB, callback);
    }

    private static makeOneScreenshot(video, ratio, thumbIndex, callback) {
        if (!video.screenshots[thumbIndex]) {
            console.error('in makeOneScreenshot, starting a video without screenshots defined at position', thumbIndex, ', video ->', video.path)
            callback(new Error('Screenshot at index ' + thumbIndex + ' not initialized, video.screenshots.length = ' + video.screenshots.length + ', video.duration = ' + video.duration), video);
            return;
        }
        const timestamp = video.screenshots[thumbIndex].timestamp;
        const filename = `${video.screenshotPrefix}-${thumbIndex + 1}-${timestamp.replace(/:/g, '')}.jpg`;

        const onDone = (screenshotCreated, errorMessage = '') => {
            if (screenshotCreated) {
                video.screenshots[thumbIndex].path = filename;
                callback(null, video);
            }
            else {
                callback(new Error(errorMessage), video);
            }
        }

        ffmpeg(video.path)
            .on("start", (commandLine) => {
                // console.log('Spawned ffmpeg with command: ' + commandLine);
            })
            .on("end", (a, b) => {
                // sometimes no error is raised, yet the screenshot wasn't created
                // parse the output to make sure the file exists
                const errorMessage = 'Output file is empty, nothing was encoded (check -ss / -t / -frames parameters if used)';
                const hasErrorMessage = b && b.indexOf(errorMessage) > -1;
                if (hasErrorMessage) {
                    // let's make extra sure and test if the screenshots exits
                    const fullpath = Path.join(video.screenshotsFolder, filename)
                    if (fs.existsSync(fullpath)) {
                        onDone(true);
                    }
                    else {
                        // try alternative method
                        const exec = require('child_process').exec;
                        const command = ffmpegPath + ' -ss ' + timestamp + ' -i "' + video.path + '" -vf scale=' + `${ratio.width}:${ratio.height}` + ' "' + fullpath + '" -r 1 -vframes 1 -an -vcodec mjpeg';
                        exec(command, (err, stdout) => {
                            if (fs.existsSync(fullpath))
                                onDone(true)
                            else
                                onDone(false, errorMessage + '\n' + err)
                        });
                    }
                }
                else {
                    onDone(true)
                }
            })
            .screenshots({
                count: 1,
                timemarks: [timestamp],
                filename: filename,
                folder: video.screenshotsFolder,
                size: `${ratio.width}x${ratio.height}`
            })
            // .size(`${ratio.width}x${ratio.height}`)
            .on('stderr', function (stderrLine) {
                // console.log('Stderr output: ' + stderrLine);
            })
            .on("error", (err, stdout, stderr) => {
                console.error('Error on thumbnail num', thumbIndex, 'For', video.path, '\n' + err)
                callback(err, video);
            });
    }

    // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/449
    /**
     * 
     * @param {Video} video 
     * @param {(video:Video) => void} callback
     * Callback returns the video with screenshots attached.
     * Saves in db.
     */
    public static makeScreenshots(video:Video, callback) {
        if (!fs.existsSync(video.path)) {
            console.error('SCR ERR File not found: ' + video.path);
            callback();
            return;
        }
        console.log('SCR', video.path)
        
        const ratio = ScreenshotEngine.calculateAspectRatioFit(video.width, video.height, MAX_WIDTH, MAX_HEIGHT, video.path);

        let thumbIndex = 0;
        let errors = [];
        function makeOneScreenshotRecursive(err, video) {
            if (err) {
                errors.push(err);
            }
            if (thumbIndex === video.screenshots.length) {
                errors = errors.length === 0 ? null : errors;
                callback(errors, video)
            }
            else {
                ScreenshotEngine.makeOneScreenshot(video, ratio, thumbIndex, makeOneScreenshotRecursive);
                thumbIndex++;
            }
        }
        makeOneScreenshotRecursive(null, video);
    }


    private static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight, path) {
        // https://stackoverflow.com/a/14731922
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        let o = { width: Math.trunc(srcWidth * ratio), height: Math.trunc(srcHeight * ratio) };
        if (isNaN(o.width) || isNaN(o.height)) {
            // console.log('NaN', o.width, o.height, path)
            return { width: MAX_WIDTH, height: MAX_HEIGHT };
        }
        return { width: Math.trunc(srcWidth * ratio), height: Math.trunc(srcHeight * ratio) };
    }

    /**
     * 
     * @param {number} duration
     */
    private static getTimestamps(duration) {
        const fifteenMinutes = 15 * 60;
        let middleDuration = duration * 0.98; // take only the middle 98% of the video
        let nbScreens = 0;
        if (middleDuration <= 15 * 60) { // equal or less than 15 minutes
            nbScreens = 15;
        }
        else if (middleDuration <= 60 * 60) { // equal or less than one hour
            nbScreens = 30;
        }
        else if (middleDuration <= 120 * 60) { // equal or less than two hours
            nbScreens = 60
        }
        else {
            nbScreens = Math.ceil(middleDuration / 3600) * 30; // 30 screenshots per hour
        }

        const step = middleDuration / nbScreens;
        const time = (duration - middleDuration) / 2; // calculate the time of the first screenshot
        const timestamps = [];
        let now = 0;
        _.times(nbScreens, (num) => {
            now = time + step * num;
            timestamps.push(moment.duration(now, 's').format("hh:mm:ss", { trim: false }));
        });

        return _.uniq(timestamps);
    }

    public static startMakingMissingScreenshot(cpuCount, handleOneDone, handleFinished?) {
        cpuCount = cpuCount || 1;

        new Persistence().getVideosWithMissingScreenshots().then(videos => {
            let asyncFunctions = [];
            _.times(videos.length, (num) => {
                const fn = function (callback) {
                    ScreenshotEngine.makeScreenshots(videos[num], (errors, video:Video) => {
                        if (video) {
                            new Persistence().update(video).then(() => {
                                if (handleOneDone)
                                    handleOneDone(video);
                            })
                            callback(null, video);
                        }
                        else {
                            if (errors)
                                console.error(errors)
                            callback(errors);
                        }
                    });
                };
                asyncFunctions.push(async.reflect(fn))
            });
            console.log('Starting screenshot generation with', cpuCount, 'parallel tasks for', videos.length, 'videos');
            console.warn('TODO: use parallel queue')
            
            async.parallelLimit(asyncFunctions, cpuCount, (err, results:[{ value?:Video, error?}]) => {
                console.log('Screenshot generation finished');
                let videos = _.compact(results.map(r => r.value));
                console.log('videos after compact')
                console.log(videos)
                
                if (handleFinished)
                    handleFinished(videos);
            });
        });
    }
}
