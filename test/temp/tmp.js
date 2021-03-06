const config = require('../../config.test.json');

describe('Util_tmp', function() {
    this.timeout(1000*60*30);
    it('Util_Duplicates', function(done) {
        const filepath = config.DatabasePath
        const db = new Datastore({ filename: filepath, autoload: true, timestampData: true });
        console.log('Gettings videos...')
        db.find({type: 'video'}, function(err, docs) {
            console.log('Looking for duplicates in', docs.length, 'videos...')
            Util.findDuplicates(docs, config.OutputFolder + 'duplicates.txt')    
            done();
        });
    })

    it('Util_deletenotfound', function(done) {
        const outputPath = config.OutputFolder + 'VideosNotFound.txt';
        const filepath = config.DatabasePath
        const db = new Datastore({ filename: filepath, autoload: true, timestampData: true });
        console.log('Gettings videos...')
        db.find({type: 'video'}, function(err, docs) {
            console.log('Checking existence of', docs.length, 'videos...')
            Util.deleteInexistant(docs, outputPath, (paths) => {
                console.log(paths.length, 'in total not found')
                if (true) {
                    const p = _.map(paths, path => 
                        new Promise((resolve, reject) => {
                            db.remove({ type: 'video', path: { $in: paths }}, (err, number) => {
                                console.log(number, 'deleted', path)
                                if (err)
                                    reject(err);
                                else
                                    resolve(number);
                            });
                        })
                    );
                    console.log(p.length, 'promises')
                    Promise.all(p).then((result) => {
                        console.log(_.sum(result), 'deleted')
                        done();
                    });
                }
                else {
                    done();
                }
            });
        });
    });
});