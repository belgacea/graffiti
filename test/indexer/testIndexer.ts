const fs = require('fs')
const assert = require('assert');
const Database = require('../../src/main/Database')
const Util = require('../../src/common/Util')
import Indexer from '../../src/background/Indexer'
import Crawler from '../../src/background/Crawler'
import Persistence from '../../src/core/Persistence';
declare var global;

// npm run test-ts -- --grep "Indexer_stat"
describe('Indexer_stat', function () {
    it('should give me some stats', function () {
        const filePath = 'A:\\input\\vid.mp4';
        const stats = fs.statSync(filePath);
        console.log(stats)
    });
})

describe('Indexer: index videos', function () {
    it('should index as first start', function (done) {
        if (fs.existsSync(global.appSettings.DatabasePath)) fs.unlinkSync(global.appSettings.DatabasePath); // delete db file

        const numberOfFilesToIndex = 4;
        const progress = (p) => {
            console.log(p, '%');
        };
        const finished = () => {
            Database.getAll('video').then(docs => {
                assert.equal(docs.length, numberOfFilesToIndex);
                if (docs && docs.length === numberOfFilesToIndex) {
                    done();
                }
                else {
                    done(new Error('docs && docs.length === numberOfFilesToIndex'));
                }
            })
        };

        Indexer.firstStartIndexing(global.appSettings, progress, finished);
    });

    it('should index files since last time started', function (done) {
        global.appSettings.WatchedFolders.push('A:\\videos\\b');
        const numberOfFilesToIndex = 5;

        const finished = (newVideos, modVideos) => {
            Database.getAll('video').then(docs => {
                assert.equal(docs.length, numberOfFilesToIndex);
                if (docs && docs.length === numberOfFilesToIndex) {
                    done();
                }
                else {
                    done(new Error('docs && docs.length === numberOfFilesToIndex'));
                }
            })
        };

        Indexer.lookForNewVideos(global.appSettings.WatchedFolders, finished);
    });
});

describe('Indexer_InitVid', function () {
    this.timeout(1000 * 60 * 10);
    it('should init without errors', function (done) {
        const filepath = '';
        const video = { path: filepath };
        Indexer.initializeVideo(video, initVid => {
            console.log(initVid);
            done();
        })
    })
})

describe('Indexer_NoDb_GetVideos', function () {
    this.timeout(1000 * 60 * 60);
    it('should index the whole folder', function (done) {
        const folders = [
        ];
        new Crawler([]).getVideosAsync(folders)
            .catch(err => console.error('getVideosAsync threw an error', err))
            .then(videos => {
                console.log('In Indexer_NoDb_GetVideos videos.length', (videos || []).length);
                done();
            });
    })
})


describe('Indexer_CleanUp', function () {
    this.timeout(1000 * 60 * 10);
    it('should do some cleanup', function (done) {
        global.appSettings = { DatabasePath: 'A:\\graffiti-db.grf' }
        Database.createOrOpen();
        const handleProgress = (p) => { console.log(p + '%') }
        Database.getAll('video').then(videos => {
            Indexer.doCleanUp(videos, handleProgress).then(result => {
                console.log(result);
                done();
            })
        });
    })
})

describe('Indexer_Duplicates', function () {
    this.timeout(1000 * 60 * 10);
    it('should return the duplicates', function (done) {
        global.appSettings = { DatabasePath: 'A:\\graffiti-db.grf' }
        Database.createOrOpen();
        const handleProgress = (p) => { console.log(p + '%') }
        Database.getAll('video').then(videos => {
            try {
                console.time('dup')
                Indexer.findDuplicates(videos, handleProgress).then(result => {
                    console.timeEnd('dup')
                    done();
                })
            }
            catch (e) {
                done(e);
            }
        });
    })
})