const assert = require('assert');
const Datastore = require('nedb');
const _ = require('lodash')
const Indexer = require('../../src/background/Indexer')

const filepath = 'A:\\test\\graffiti-db.grf'
const db = new Datastore({ filename: filepath, autoload: true, timestampData: true });

describe('Temp_matchPerson_db_1', function () {
    this.timeout(1000 * 60 * 10);
    it('should match', function (done) {

        const promises = [];
        db.find({ type: 'person' }, function (err, people) {
            console.log('Total:', people.length, 'people')
            db.find({ type: 'video' }, function (err, videos) {
                console.log('Total:', videos.length, 'videos')
                
                // delete all people from videos
                // _.each(videos, v => v.people = []);

                for (let i = 0; i < people.length; i++) {
                    let person = people[i];

                    let vidOfPerson = _.filter(videos, v => _.includes(v.people, person._id))

                    const matched = Indexer.matchPerson(videos, person);

                    console.log(person.name)
                    console.log('\t' + vidOfPerson.length + ' videos')
                    console.log('\t' + matched.length + ' matched')
                    // if (person.name === '')
                    for (let m = 0; m < matched.length; m++) {
                        console.log('\t' + matched[m].path)
                    }

                    // _.each(matched, video => {
                    //     promises.push(new Promise((resolve, reject) => {
                    //         db.update({ _id: video._id }, video, {}, function (err, numAffected, affectedDocuments, upsert) {
                    //             resolve();
                    //         });
                    //     }))
                    // })
                }

                Promise.all(promises).then(() => {
                    done();
                })
            });
        });
    })
})

describe('Temp_notMatchPerson', function () {
    this.timeout(1000 * 60 * 10);
    it('should not match', function () {
        const person3 = { _id: 'S', name: '' };

        const _matchable = [
            { path: '' }
        ];

        const allMatched = Indexer.matchPerson(_matchable, person3);
        // console.log(allMatched);
        assert.equal(allMatched.length, 0);
    })
})
describe('Temp_matchPerson_nodb_1', function () {
    this.timeout(1000 * 60 * 10);
    it('should match all', function () {
        const person3 = { _id: 'S', name: '' };

        const _matchable = [
            { path: '' },
        ];

        const allMatched = Indexer.matchPerson(_matchable, person3);
        // console.log(allMatched);
        assert.equal(allMatched.length, _matchable.length);
    })
})

describe('Temp_matchPerson_db_newPerson', function () {
    this.timeout(1000 * 60 * 10);
    it('should not match', function (done) {
        const person3 = { _id: 'S', name: '' };

        db.find({ type: 'video' }, function (err, videos) {
            const allMatched = Indexer.matchPerson(videos, person3);
            _.each(allMatched, v => console.log(v.path))
            console.log('matched:', allMatched.length)
            done();
        });
    })
})


describe('Temp_search', function () {
    this.timeout(1000 * 60 * 10);
    it('should search', function (done) {
        let words = [];
        const matches = (video, search) => {
            // words = _.compact(search.replace(/[.-_&]/g, ' ').trim().toLocaleLowerCase().split(' '));
            words = _.compact(search.replace(/[\W]/g, ' ').trim().toLocaleLowerCase().split(' '));
            // words = search.trim().toLocaleLowerCase().split(' ');
            for (let i = 0; i < words.length; i++) {
                let w = words[i];
                if (!video.path.toLocaleLowerCase().includes(w)) {
                    return false;
                }
            }
            return true;
        }

        db.find({ type: 'video' }, function (err, videos) {
            let results = videos.filter((v) => matches(v, ''));
            console.log('results:', results.length)
            console.log(words)
            done()
        });
    })
})