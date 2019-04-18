const Path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const Database = require('../../src/main/Database');
const dbFilepath = 'A:\\temp.grf'


describe('EnsureThumbNotOnHdd', function () {
    this.timeout(1000 * 60 * 60 * 24); // 24 hours
    it('thumbs that are not in db should not be in hdd, delete if found', function (done) {
        Database.createOrOpen(({ DatabasePath: dbFilepath }));
        Database.getVideosWithMissingScreenshots().then(videos => {
            for (let i = 0; i<videos.length; i++) {
                const video = videos[i];
                for (let j = 0; j < video.screenshots.length; j++) {
                    const screenshot = video.screenshots[j];
                    if (!screenshot.path) {
                        // screenshot not in db, ensure does not exists on disk
                        const filename = `${video.screenshotPrefix}-${j + 1}-${screenshot.timestamp.replace(/:/g,'')}.jpg`;
                        const fullpath = Path.join(video.screenshotsFolder, filename)
                        if (fs.existsSync(fullpath)) {
                            console.log(video.path)
                            console.log(' --> ' + filename + ' exists on disk but not in db');
                            fs.unlinkSync(fullpath);
                            if (fs.existsSync(fullpath)) {
                                console.log(' --> not deleted')
                            }
                            else {
                                console.log(' --> deleted')
                            }
                        }
                    }
                }
            }
            console.log('FINISHED')
        })
    });
});
