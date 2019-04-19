import * as assert from 'assert'
import * as fs from 'fs'
import * as Database from '../src/main/Database'
import AppSettings from '../src/types/AppSettings'
import Video from '../src/types/Video'
const config = require('../config.test.json');

function setup() {
    const dbPath = config.DatabasePath
    fs.unlinkSync(dbPath)
    Database.createOrOpen({
        DatabasePath: dbPath
    });
}

describe('Database_insert_settings', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        setup();
        let settings = new AppSettings();
        Database.insert(settings).then(settings => {
            assert.notEqual(settings, undefined);
            done()
        })
    });
});

describe('Database_checkIsFirstStart', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        Database.checkIsFirstStart().then((isFirstStart) => {
            assert.equal(isFirstStart, false);
            done()
        })
    });
});

describe('Database_loadSettings', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        Database.loadSettings().then((settings) => {
            assert.notEqual(settings, undefined);
            done()
        })
    });
});

describe('Database_getSettings', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        Database.getSettings().then(settings => {
            assert.notEqual(settings, undefined);
            done()
        })
    });
});

describe('Database_insert_video', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        let video = new Video('somepath');
        (video as any)._id = 'v'
        Database.insert(video).then((v: Video) => {
            assert.equal(v.path, 'somepath');
            done()
        })
    });
});

// describe('Database_get_video', function () {
//     this.timeout(1000 * 60 * 10);
//     it('', function (done) {
//         let video = new Video('somepath');

//         Database.insert(video, (err, v:Video) => {
//             assert.equal(v.path, 'somepath');
//             done()
//         })
//     });
// });

describe('Database_update_video', function () {
    this.timeout(1000 * 60 * 10);
    it('', function (done) {
        let video = new Video('somepath changed');
        (video as any)._id = 'v'

        Database.update(video)
            .then(() => {
                Database.getByIds(['v']).then(docs => {
                    assert.equal(docs.length, 1);
                    assert.equal(docs[0].path, 'somepath changed')
                    done()
                })
            })
            .catch(err => {
                done(err)
            })
    });
});