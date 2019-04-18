const _ = require('lodash')
const Path = require('path')
const fs = require('fs')
const exec = require('child_process').exec;
const Constants = require('./Constants').Constants
const Helper = require('./Helper')
const md5 = require('md5')
const async = require('async');

const ffmpeg = require("fluent-ffmpeg");

var moment = require('moment');
require("moment-duration-format");

exports.getMetadata = getMetadata;
/**
 * Returns callback(err,metadata)
 * @param {*} videoPath 
 * @param {*} callback err, metadata
 */
function getMetadata(videoPath, callback) {
    // console.log('ffmpeg.ffprobe', videoPath)
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
        // console.log('err = ')
        // console.log(err)
        // console.log('metadata');
        // console.log(metadata);
        // console.log('_______________________________________')
        // console.log('format')
        // console.log(metadata.format)
        // console.log('width', metadata.streams[0].width ? metadata.streams[0].width : metadata.streams[1].width);
        // console.log('height', metadata.streams[0].height ? metadata.streams[0].height : metadata.streams[1].height);
        // console.log('duration', metadata.format.duration)
        // console.log('duration moment', moment.duration(metadata.format.duration, 's').format("hh:mm:ss", {trim:false}));
        // console.log('size', metadata.format.size)
        try {
            if (metadata) {
                callback(null, metadata);
            }
            else {
                callback(err);
            }
        }
        catch(e) {
            // console.error(e)
            console.error('Util.getMetadata: Error metadata for', videoPath)
            callback(e);
        }
    });
}

exports.fillUpMetadata = fillUpMetadata;
/**
 * Returns callback(err, video)
 * @param {*} video 
 * @param {*} metadata 
 * @param {*} callback 
 */
function fillUpMetadata(video, metadata, callback) {
    // console.log(metadata)
    try {
        video.width = metadata.streams[0].width ? metadata.streams[0].width : metadata.streams[1].width;
        video.height = metadata.streams[0].height ? metadata.streams[0].height : metadata.streams[1].height;
        video.duration = metadata.format.duration;
        video.length = moment.duration(metadata.format.duration, 's').format("hh:mm:ss", {trim:false});
        video.size = metadata.format.size;
        delete metadata.format.filename;
        video.hash = md5(JSON.stringify(metadata));
        callback(null, video);
    }
    catch(e) {
        console.error('fillUpMetadata error ->', video.path)
        // console.error(e)
        callback(e, null);
    }
}

exports.uuid = uuid;
function uuid(keepDash) {
    const uuidv1 = require('uuid/v1');
    let uuid = uuidv1();
    if (!keepDash)
        uuid = uuid.replace(/-/g,'');
    return uuid;
}

exports.findDuplicates = (videos, outputPath) => {
    let dictionnaryDuplicates = {};
    _.each(videos, (video) => {
        let f = dictionnaryDuplicates[video.hash] || [];
        f.push(video.path);
        dictionnaryDuplicates[video.hash] = f;
    });

    let str = '';
    _.each(dictionnaryDuplicates, (paths, key) => {
        if (paths > 1)
            console.log(key, '\t', paths.length)
        if (paths.length > 1) {
            str = str + 'Duplicate ' + key + '\n';
            _.each(paths, (p) => {
                str = str + '\t' + p + '\n'
            })
        }
    });

    str = str.trim();
    if (str.length > 0) {
        if (outputPath) {
            fs.writeFileSync(outputPath, str);
            console.log("The file was saved!");
        }
        else {
            console.log(str)
        }
    }
    else {
        console.log('No duplicates')
    }
}

exports.deleteInexistant = (videos, outputPath, callbackFinished) => {
    let fileToDelete = 0;
    let progressCount = 0;
    const asyncFunctions = [];
    _.each(videos, video => {
        asyncFunctions.push(function(callback) {
            try {
                fs.exists(video.path, exists => {
                    let pathToDelete = exists ? null : video.path
                    exists ? undefined : fileToDelete++;
                    
                    progressCount++;
                    console.log(Math.trunc((progressCount / videos.length) * 100) + ' %', progressCount, 'sur', videos.length);
                    callback(null, pathToDelete);
                });
            }
            catch(e) {
                console.log('error on ', video.path)
                console.error(e)
                callback(null);
            }
        })
    });
    
    async.parallelLimit(asyncFunctions, 8, (err, result) => {
        console.log('analyse finished. fileToDelete = ' + fileToDelete);
        const errors = _.filter(result, r => r === null).length;
        result = _.compact(result);

        if (outputPath) {
            let str = '\t' + result.length + ' video(s) not found:\n' + result.join('\n');
            fs.writeFileSync(outputPath, str);
            console.log("The file was saved!");
        }
        if (errors)
            console.log('/!\\', errors, 'errors')

        callbackFinished(result);
    })
}

exports.recycleFile = (path) => {
    console.log('Util.recycleFile', path)

    // let ffmpegPath = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked\\node_modules\\ffmpeg-static');
    // let ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked\\node_modules\\ffprobe-static');
    // if (Helper.env.isDev()) {
        // ffmpegPath = Path.join(process.cwd(), 'node_modules', 'ffmpeg-static', ffmpegPath);
        // ffprobePath = Path.join(process.cwd(), 'node_modules', 'ffprobe-static', ffprobePath);
    // }

    // console.log('ffmpegPath:', ffmpegPath)
    // console.log('ffprobePath:', ffprobePath)
    let recycleExe;
    if (Helper.env.isDev() || Helper.env.isTest()) {
        recycleExe = Path.join(process.cwd(), 'extras', 'Recycle.exe');
    }
    else {
        console.log('recycle.exe\'s path:', recycleExe)
        recycleExe = Path.join(process.cwd(), 'extras', 'Recycle.exe');
    }
    
    const promise = new Promise((resolve, reject) => {
        const callback = (err, stdout) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stdout);
            }
        };
        exec('"'+ recycleExe + '" -f "' + path + '"', callback);
    });

    return promise;
}

exports.renameFile = (path, newName) => {
    console.warn('TODO: different way of renaming according to platform');

    const promise = new Promise((resolve, reject) => {
        const callback = (err, stdout) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stdout);
            }
        };
            
        if (process.platform === 'win32') {
            exec(`RENAME "${path}" "${newName}"`, callback)
        }
        else {
            reject(new Error('Rename only works on Windows for now'))
        }
    });

    return promise;

}

exports.createFolderSync = (dirPath) => {
    // https://stackoverflow.com/a/24311711/8811000
    try {
        fs.mkdirSync(dirPath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}