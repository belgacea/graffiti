import * as _ from 'lodash'
import * as fs from 'fs'
import * as chokidar from 'chokidar'
const Util = require('../common/Util');

const checkFileDelaySeconds = 2;

export default class Watcher {
    // public static watchers = [];

    private wrapper;

    private isReady: boolean;
    public onReady: () => void;
    public onNew: (path:string) => void;
    public onChanged: (path: string) => void;

    public watchFolder(folders:string[]) {
        folders = folders.map(f => f.replace(/\/+$/, "").replace(/\\+$/, "")); // drives shouldn't end with slash or backslash
        console.log('Watcher.watchFolder', folders)
        const watcher = chokidar.watch(folders);
        const watcherWrapper = {
            watcher: watcher,
            path: folders,
            // isReady: false,
            // onAdd: onNewFile,
            // onChange: onChangedFile
        };
        this.wrapper = watcherWrapper;
        // Watcher.watchers.push(watcherWrapper);

        watcher
            .on('add', (path) => {
                if (this.isReady) {
                    console.log('[watcher.add]', path);
                    this.onAdd(watcherWrapper, path)
                }
                // Indexer.addFile(path);
            })
            .on('addDir', (path) => { 
                if (this.isReady)
                    console.log('[watcher.addDir]', path);
                    // console.log('Directory', path, 'has been added');
                // Indexer.lookForNewVideos(path, cb)
            })
            .on('change', (path) => {
                if (this.isReady) {
                    console.log('[watcher.change]', path);
                    this.onChange(watcherWrapper, path)
                }
            })
            .on('unlink', (path) => {
                if (this.isReady) {
                    console.log('[watcher.unlink]', path);
                    // console.log('Watcher.unlink File', path, 'has been removed');
                }
                // Indexer.deleteFile(path)
            })
            .on('unlinkDir', (path) => {
                if (this.isReady) {
                    console.log('[watcher.unlinkDir]', path);
                    // console.log('Watcher.unlinkDir Directory', path, 'has been removed');
                }
                // Indexer.deleteFolder(path)
            })
            .on('error', (error) => {
                if (this.isReady) {
                    console.log('[watcher.error]', error);
                    // console.log('Watcher.onError', error);
                }
            })
            .on('ready', () => {
                this.isReady = true;
                    console.log('[watcher.ready]', folders);
                if (this.onReady) {
                    this.onReady();
                }
            })
            .on('raw', (event, path, details) => {
                if (this.isReady) {
                    // console.log('[watcher.raw] Raw event info:', event, path, details);
                }
            })
    }

    public clear() {
        // console.log('Watcher.clear', 'clearing watcher')
        this.wrapper.watcher.unwatch(this.wrapper.path);
        this.wrapper.watcher.close();
    }

    private onAdd(watcher, path) {
        // TODO isVideo & shouldIgnoreFolder (!this.isReady || !Util.isVideo(path) || Util.shouldIgnoreFolder(path)) {
        if (!this.isReady) {
            return;
        }
        // console.log('Watcher.onAdd', path, 'has been added');

        fs.stat(path, (err, stat) => {
            if (!err) {
                setTimeout(Watcher.checkFileCopyComplete, checkFileDelaySeconds * 1000, path, stat, 10, () => {
                    if (this.onNew)
                        this.onNew(path);
                });
            }
        });
    }

    private onChange(watcher, path) {
        //log('File', path, 'has been changed');
        // TODO isVideo & shouldIgnoreFolder (!this.isReady || !Util.isVideo(path) || Util.shouldIgnoreFolder(path)) {
        if (!this.isReady) {
            return;
        }

        // console.log('onChange', path)

        fs.stat(path, function (err, stat) {
            if (!err) {
                setTimeout(Watcher.checkFileCopyComplete, checkFileDelaySeconds * 1000, path, stat, 2, () => watcher.onChange(path));
            }
        });
    }

    // Makes sure that the file added to the directory, but may not have been completely copied yet by the
    // Operating System, finishes being copied before it attempts to do anything with the file.
    // https://violentatom.com/2015/07/08/node-js-chokidar-wait-for-file-copy-to-complete-before-modifying/
    private static checkFileCopyComplete(path, prev, times = 5, onReady) {
        fs.stat(path, function (err, stat) {
            if (err) {
                throw err;
            }
            if (stat.mtime.getTime() === prev.mtime.getTime()) {
                onReady();
            }
            else {
                setTimeout(Watcher.checkFileCopyComplete, checkFileDelaySeconds * 1000, path, stat, --times, onReady);
            }
        });
    }
}
