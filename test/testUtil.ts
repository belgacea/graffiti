const assert = require('assert');
const Util = require('../src/common/Util')
const Helper = require('../src/common/Helper')
const Datastore = require('nedb');
const _ = require('lodash')
import Crawler from '../src/background/Crawler'

describe('Util', function() {
    it('Util.System: should not contain system folders', function() {
        let folders = Util.walkSync('');
        assert.equal(folders.length, 11, 'A file was added?');
    });

    it('Util_Parallel: should crawl in parallel', function(done) {
        // var t0 = performance.now();
        console.time('test')
        this.timeout(1000*60*10);
        const folders = [
            
        ]
        new Crawler([]).getVideosAsync(folders)
            .catch(err => console.error('getVideosAsync threw an error', err))
            .then(videos => {
                // var t1 = performance.now();
                // console.log("Crawl took " + (t1 - t0) + " milliseconds.", (t1-t0) / 1000, 'seconds')
                console.timeEnd('test')
                console.log('In testUtil.js videos.length', (videos || []).length);
                done();
            });
    })
});

describe('Util_recycle', function() {
    it('Util.recyle: should move file to bin', function(done) {
        // console.log('test:', Helper.env.isTest())
        // console.log('dev:', Helper.env.isDev())
        const path = '';
        Util.recycleFile(path)
        .then(stdout => { console.log('success \n' + stdout); done();})
        .catch(err => { console.log(err); done(err); });
    })
})