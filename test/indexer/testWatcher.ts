import Watcher from '../../src/background/Watcher'
import * as fs from 'fs'
import * as assert from 'assert'
const exec = require('child_process').exec;
const config = require('../../config.test.json');

describe('Watcher_move', function() {
    this.timeout(1000*60*0.5); // 30 seconds
    it('should detect a move', function(done) {
        const sourcePath = config.InputFolder + '\\sample videos\\Video (3).mp4';
        const targetPath = config.Drives[1] + 'Video (3).mp4';

        if (!fs.existsSync(sourcePath)) {
            done(new Error('Source file does not exist'));
        }

        const w = new Watcher();

        w.onNew = (path) => {
            w.clear();
            // console.log('in test.onNewFile:', path, 'added')
            exec(`move "${targetPath}" "${sourcePath}"`, () => {done()});
        }

        // w.onChanged = (path) => {
        //     // w.clear();
        //     console.log('in test.onChangedFile:', path, 'changed')
        //     exec(`move "${targetPath}" "${sourcePath}"`, () => {done()});
        // }

        w.onReady = () => {
            exec(`move "${sourcePath}" "${targetPath}"`, () => {console.log('move done')});
        }
        
        w.watchFolder(config.Drives)
    });
})
