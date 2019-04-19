const Path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const Database = require('../../src/main/Database');
const config = require('../../config.test.json');
const dbFilepath = config.DatabasePath
var count = 0;

const mkdirSync = function (dirPath) {
    try {
        fs.mkdirSync(dirPath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}
const mkdirpSync = function mkdirpSync(dirPath) {
    const parts = dirPath.split(Path.sep)

    // For every part of our path, call our wrapped mkdirSync()
    // on the full path until and including that part
    for (let i = 2; i <= parts.length; i++) {
        let sub = Path.join.apply(null, parts.slice(0, i));
        console.log('creating', sub)
        mkdirSync(sub)
    }
}
const callback = function (err) {
    if (err)
        console.log(err);
    else
        console.log('copied', ++count);
}

describe('Temp_MoveThumbsAndPictures', function () {
    
    it('Temp_MoveThumbsAndPictures_1 should move all thumbs to other destination and save settings', function (done) {
        Database.createOrOpen(({ DatabasePath: dbFilepath }));
        count = 0;
        this.timeout(1000 * 60 * 60 * 24); // 24 hours
        // create destination folder
        mkdirpSync(newThumbnailFolder);

        Database.getSettings().then(settings => {
            console.log('settings:', settings);


            Database.getAll('video').then(videos => {

                for (let i = 0; i < videos.length; i++) {
                    const video = videos[i];
                    // append hash to folder
                    let newFolder = Path.join(newThumbnailFolder, video.hash);
                    mkdirpSync(newFolder);

                    // copy all thumbs to new thumbnail folder
                    for (let j = 0; j < video.screenshots.length; j++) {
                        let screenshotPath = video.screenshots[j].path;
                        if (screenshotPath) {
                            let currentThumbFullpath = Path.join(video.screenshotsFolder, screenshotPath);
                            let newThumbFullpath = Path.join(newFolder, screenshotPath);
                            // copy thumb to dest
                            exec('copy "' + currentThumbFullpath + '" "' + newThumbFullpath + '"', callback);
                        }
                    }

                    // update video thumb path
                    video.screenshotsFolder = newFolder;
                }

                settings.ThumbnailFolder = newThumbnailFolder;

                Database.update(settings).then(() => {
                    Database.updateAll(videos).then(num => {
                        console.log('FINISHED. num:', num);
                        // done();
                    })
                });
            });
        });
    })

    it('Temp_MoveThumbsAndPictures_2 should move all pictures to other destination and save settings', function (done) {
        Database.createOrOpen(({ DatabasePath: dbFilepath }));
        count = 0;
        this.timeout(1000 * 60 * 10);
        // create destination folder
        mkdirpSync(newPictureFolder);
        
        Database.getSettings().then(settings => {
            Database.getAll('person').then(people => {

                for (let i = 0; i < people.length; i++) {
                    const person = people[i];
                    let currentPicturePath = person.photo;
                    console.log('settings.PictureFolder', settings.PictureFolder)
                    console.log('newPictureFolder', newPictureFolder)
                    let newPicturePath = person.photo.replace(Path.resolve(settings.PictureFolder), Path.resolve(newPictureFolder));
                    console.log('currentPicturePath', currentPicturePath)
                    console.log('newPicturePath', newPicturePath)
                    console.log('command=')
                    console.log('copy "' + currentPicturePath + '" "' + newPicturePath + '"')
                    exec('copy "' + currentPicturePath + '" "' + newPicturePath + '"', callback);
                    person.photo = newPicturePath;
                }

                settings.PictureFolder = newPictureFolder;
                Database.update(settings, () => {
                    Database.updateAll(people, (num) => {
                        console.log('FINISHED. num:', num);
                        // done();
                    })
                });
            });
        });

    })
})