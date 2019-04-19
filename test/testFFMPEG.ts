import ScreenshotEngine from '../src/background/ScreenshotEngine'
const Util = require('../src/common/Util')
const ffmpeg = require("fluent-ffmpeg");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
require("moment-duration-format");
const config = require('../config.test.json');

describe('FFMPEG-Metadata', function() {
    it('should not be undefined', function(done) {
        const folder = "";
        const filePath = folder + ""
        
        let video = {
            path: filePath
        }
        
        Util.getMetadata(video.path, (err, metadata) => {
            // console.log('ERROR =', err)
            // console.log('METADATA =', !!metadata)
            console.log('METADATA FOR', filePath)
            console.log(metadata)
            Util.fillUpMetadata(video, metadata, (err, video) => {
                console.log('video hash:', video.hash)
                console.log(video.hash)
                if (metadata)
                    done();
                else
                    done(err);
            });
        });
    });
});

describe('Screenshot: alternative', function() {
    this.timeout(1000*60*10);

    it('should create screenshot with other command', function(done) {
        const ratio = { width: 250, height: 140 };
        let video:any = {};
        
        video.screenshotsFolder = config.appSettings.ThumbnailFolder;
        
        // ScreenshotEngine.makeOneScreenshot(video, ratio, 0, (err, video) => {
        // ScreenshotEngine.initScreenshot(video, (err, video) => {
        ScreenshotEngine.makeScreenshots(video, (err, video) => {
            // console.log(err)
            // console.log(video)
            if (!err) {
                const fullpath = path.join(video.screenshotsFolder, video.screenshots[0].path);
                const exists = fs.existsSync(fullpath);
                // console.log('complete path [ exists =',exists,'] :', fullpath)
                if (exists) {
                    done();
                }
                else {
                done(new Error('screenshot does not exists'));
                }
            }
            else {
                console.error(' -------------------- TEST ERROR -------------------- ');
                done(new Error('screenshot does not exists'));
            }
        })
    })
})

/**
 * FOR TESTING PURPOSES ONLY
 */
function errorScreenshot(videoPath, callback) {
    ffmpeg(videoPath)
    .on("start", (commandLine) => {
        console.log('Spawned ffmpeg with command: ' + commandLine);
    })
    .on("end", (a, b) => {
        callback(true);
    })
    .on("error", (err, stdout, stderr) => {
        console.log('--- err')
        console.error(err)
        console.log('--- stdout')
        console.error(stdout)
        console.log('--- stderr')
        console.error(stderr)
        callback(false);
    })
    .size('100x100')
    .screenshots({
        count: 1,
        timemarks: ['00:00:25'],
        filename: 'screenshot.jpg',
        folder: config.appSettings.ThumbnailFolder
    })
    .complexFilter([])
}

