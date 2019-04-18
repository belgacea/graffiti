import * as Path from 'path'
import * as fs from 'fs'
import * as async from 'async'
import * as _ from 'lodash'
import * as Util from '../src/common/Util';
import Video from "../src/types/Video";
import * as md5 from 'md5';

export default class TestCore {

    public static writeMetadata(outputDir: string, video: Video, metadata: any) {
        // console.log('Writing', video.path);
        const outputPath = Path.join(outputDir, video.hash + '.txt');
        fs.writeFile(outputPath, `${video.path}\n${video.hash}\n${JSON.stringify(metadata, null, "\t")}`, (err) => {
            if (err)
                throw err;
            console.log('File for', Path.basename(video.path), 'exported at', outputPath);
        });
    }

    public static exportMetadatas(outputDir: string, videos: Video[]) {
        let asyncFunctions = [];
        _.times(videos.length, (num) => {
            let fn = function (callback) {
                const video = videos[num];
                // console.log('Getting metadata for', video.path);
                Util.getMetadata(video.path, (err, metadata) => {
                    if (metadata) {
                        console.log('Got metadata for', video.path)
                        Util.fillUpMetadata(video, metadata, (err, video) => {
                            if (err) {
                                console.error('ERR1', err)
                                callback(null, err);
                            }
                            else {
                                try {
                                    TestCore.writeMetadata(outputDir, video, metadata);
                                    callback(null);
                                }
                                catch (e) {
                                    console.error('ERR2', e)
                                    callback(null, e);
                                }
                            }
                        });
                    }
                    else {
                        console.error('ERR3', err)
                        callback(null, err);
                    }
                });
            }
            asyncFunctions.push(async.reflect(fn))
        });

        return new Promise((resolve, reject) => {
            console.log('Export hash about to run', asyncFunctions.length, 'functions in parallel for', videos.length, 'videos');
            async.parallelLimit(asyncFunctions, 4, (err, results: [{ value?, error?}]) => {
                console.log('finished parallel work for', asyncFunctions.length, 'functions')
                console.log('err:', err)
                resolve();
            });
        })
    }

    public static refreshHash(videos: Video[], callbackFinished) {
        let textResult = '';
        let errorResult = '';
        let hashChanged = 0;
        const asyncFunctions = [];
        _.each(videos, video => {
            asyncFunctions.push(function (callback) {
                try {
                    Util.getMetadata(video.path, (err, metadata) => {
                        if (!metadata) {
                            console.error('error metadata', video.path)
                            errorResult += 'error metadata ' + video.path + '\n'
                            callback(null)
                            return;
                        }
                        delete metadata.format.filename;
                        let hash = md5(JSON.stringify(metadata)) as string;
                        if (video.hash !== hash) {
                            console.log(video.hash, 'changed to', hash)
                            textResult += video.hash + '\tchanged to\t' + hash + '\n';
                            video.hash = hash;
                            hashChanged++;
                            callback(null, video)
                        }
                        else {
                            callback(null);
                        }
                    });
                }
                catch (e) {
                    console.log('error on ', video.path)
                    console.error(e)
                    callback(null);
                }
            })
        });

        async.parallelLimit(asyncFunctions, 8, (err, result) => {
            console.log('refresh finished. hashChanged = ' + hashChanged);
            result = _.compact(result);
            callbackFinished(result, textResult, errorResult);
        })
    }
}