import * as Util from '../../src/common/Util';
import * as fs from 'fs'
import * as async from 'async'
import * as _ from 'lodash'
import * as assert from 'assert'
import * as Path from 'path'
import * as Datastore from 'nedb'
import Crawler from '../../src/background/Crawler'
import Video from '../../src/types/Video';
import TestCore from '../TestCore';
const config = require('../../config.test.json');

describe('Hash_CompareTwo', function () {
    this.timeout(1000 * 60 * 10);
    it('should be the same', function (done) {
        const leftPath = "";
        const rightPath = ""

        let leftVideo = {
            path: leftPath
        }
        let rightVideo = {
            path: rightPath
        }

        if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath))
            done(new Error('un des deux fichiers n\'existe pas'));

        Util.getMetadata(leftPath, (err, metadata) => {
            // console.log('ERROR =', err)
            console.log('LEFT METADATA =', metadata)
            Util.fillUpMetadata(leftVideo, metadata, (err, leftVideo) => {
                console.log('left hash:', leftVideo.hash)

                Util.getMetadata(rightPath, (err, metadata) => {
                    // console.log('ERROR =', err)
                    console.log('RIGHT METADATA =', metadata)
                    Util.fillUpMetadata(rightVideo, metadata, (err, rightVideo) => {
                        console.log('right hash:', rightVideo.hash)
                        console.log(leftVideo.hash, leftVideo.hash === rightVideo.hash, rightVideo.hash)
                        if (leftVideo.hash === rightVideo.hash) {
                            done();
                        }
                        else {
                            console.log('err', err)
                            done(new Error('not the same hash'));
                        }
                    });
                });
            });
        });
    });
});

describe('Hash_export', function () {
    this.timeout(1000 * 60 * 10);
    it('should export hash into file', function (done) {

        const outputDir = config.OutputFolder;
        const folder = "";
        const filePaths = [
            // Path.join(folder, ''),
            ''
        ];

        Util.createFolderSync(outputDir);

        TestCore.exportMetadatas(outputDir, filePaths.map(filePath => new Video(filePath)))
        .then(() => done() )
        .catch((err) => done(err) )
    });
});

describe('Hash_all_export', function () {
    this.timeout(1000 * 60 * 240);
    it('should export all hashes into file', function (done) {
        const outputDir = config.Drive;

        Util.createFolderSync(outputDir);

        new Crawler([]).getVideosAsync([config.InputFolder])
            .catch(err => console.error('getVideosAsync threw an error', err))
            .then((videos: Video[]) => {
                console.log('In Hash_all_export videos.length', videos.length);
                TestCore.exportMetadatas(outputDir, videos).then(() => {
                    done();
                })
            })
            .catch(err => console.error('err after exportHash'));
    });
});

describe('Hash_refresh', function() {
    this.timeout(1000 * 60 * 240);
    it('should regenerate the hashes in the db file', function(done) {
        const update = (doc, callback) => {
            db.update({ _id: doc._id }, doc, {}, function (err, numAffected, affectedDocuments, upsert) {
              if (callback)
                callback(err, numAffected);
            });
        }
        const updateAll = (docs, callback) => {
            let promises = []
            docs.map((doc) => {
                promises.push(new Promise((resolve, reject) => {
                  update(doc, () => {
                    resolve();
                  });
                }));
            });
          
            Promise.all(promises).then(() => {
              if (callback) {
                callback();
              }
            });
          }

        const filepath = config.DatabasePath
        const db = new Datastore({ filename: filepath, autoload: true, timestampData: true });
        console.log('Gettings videos...')
        db.find({type: 'video'}, function(err, docs) {
            console.log('Refreshing hash for', docs.length, 'videos...')
            TestCore.refreshHash(docs, (videos, textResult, errorResult) => {
                console.log(videos.length, 'in total hash refreshed')
                fs.writeFile(config.Drive + 'hash_change_result.txt', `${textResult}`, (err) => {
                    if (err)
                        throw err;
                });
                fs.writeFile(config.Drive + 'hash_error_result.txt', `${errorResult}`, (err) => {
                    if (err)
                        throw err;
                });
                updateAll(videos, (count) => {
                    console.log('updated', count)
                    done();
                });

            })
        });
    });
})