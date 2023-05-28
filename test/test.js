// // https://mochajs.org/
// // https://jrsinclair.com/articles/2016/gentle-introduction-to-javascript-tdd-intro/
// const assert = require('assert');
// // describe('Array', function() {
// //   describe('#indexOf()', function() {
// //     it('should return -1 when the value is not present', function() {
// //       assert.equal(-1, [1,2,3].indexOf(4));
// //     });
// //   });
// // });
const Path = require('electron').remote.require('path');
const config = require('../config.test.json');

// const workspace = config.Drive
// global.appSettings = {
//   ThumbnailFolder: Path.join(workspace, '/thumbnails_test'),
//   PictureFolder: Path.join(workspace, '/pictures_test'),
//   DatabasePath: Path.join(workspace, 'graffiti-db-test.grf'),
//   ErrorLogPath: Path.join(workspace, 'errorlog.grf'),
//   WatchedFolders: [
//       config.Drive,
//     ]
// };

/*
// TESTS TO EXECUTE
lookForNewVideos  actually changes path when folder change or rename
initializeVideo   test file size 0
initializeVideo   test when video file extension but actually is texte
Test case for watcher
  move a alot of vids from hdd1 to hdd2 (big files and small)
  move a lot of vids from hdd1\path1 to hdd1\path2 (big files and small)
*/