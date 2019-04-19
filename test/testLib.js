const async = require('async')
const nedb = require('nedb')
const config = require('../config.test.json');

describe('Async', function() {
    it('async.parallel', function(done) {
        async.parallel([
            function(callback) {
                setTimeout(function() {
                    callback(null, 'one');
                }, 200);
            },
            function(callback) {
                setTimeout(function() {
                    callback('error1');
                }, 100);
            },
            function(callback) {
                setTimeout(function() {
                    callback(null, 'three');
                }, 300);
            },
        ],
        /*
        results will always have a number of elements equal to number of executed functions, some elements might be undefined is errors are returned
        err will always be the last error, null errors don't overwrite previously returned errors
        problem: if a function returns an error, other values will be undefined
         */
        // optional callback
        function(err, results) {
            // the results array will equal ['one','two'] even though
            // the second function had a shorter timeout.
            console.log('err:', err)
            console.log('results:', results)
            done()
        });
    });

    it('async.reflect', function(done) {
        async.parallel([
            async.reflect(function(callback) {
                setTimeout(function() {
                    callback(null, 'one');
                }, 200);
            }),
            async.reflect(function(callback) {
                setTimeout(function() {
                    callback('error2');
                }, 100);
            }),
            async.reflect(function(callback) {
                setTimeout(function() {
                    callback(null, 'three');
                }, 300);
            })
        ],
        
        // optional callback
        function(err, results) {
            console.log('err:', err)
            console.log('results:', results)
            // err: null
            // results: [ { value: 'one' }, { error: 'error2' }, { value: 'three' } ]
            done()
        });
    });
});

describe('nedb', function() {
    this.timeout(1000*60*10);
    it('nedb.find.id', function(done) {
        const filepath = config.appSettings.DatabasePath
        let db = new nedb({ filename: filepath, autoload: true, timestampData: true })
        console.time(); // TODO: https://nodejs.org/api/perf_hooks.html#perf_hooks_performance_now
        db.findOne({ _id: 'hTS4fct56J0x85uw'}, function(err, doc) {
            console.timeEnd();
            console.log(doc.path)
            done();
        })
    })
})