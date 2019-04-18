import * as _ from 'lodash'
import * as fs from 'fs'
import * as async from 'async'
import * as Path from 'path'
import Video from '../types/Video';
import { Constants } from '../common/Constants.js';

export default class Crawler {
    private ignoredFolders;

    constructor(ignoredFolders: string[]) {
        this.ignoredFolders = [...ignoredFolders, ...['$RECYCLE.BIN', 'System Volume Information']];
    }

    private readdirAsync(dir: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                resolve(files);
            })
        })
    }

    private statAsync(fullPath: string): Promise<fs.Stats> {
        return new Promise((resolve, reject) => {
            fs.stat(fullPath, (err, stats) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stats);
                }
            })
        })
    }

    private crawlRecursiveAsync(dir) {
        if (this.shouldIgnoreFolder(dir)) {
            console.log('Ignored folder, will not crawl:', dir);
            return Promise.resolve([])
        }

        return this.readdirAsync(dir)
            .catch(err => console.error('hopla'))
            .then(files => {
                files = files || [];
                const promises = files.map((file, index) => {
                    const fullPath = Path.join(dir, file);
                    return new Promise((resolve, reject) => {
                        if (this.shouldIgnoreFolder(fullPath)) {
                            console.log('Ignored folder, will not proceed:', fullPath);
                            resolve()
                        }
                        else {
                            this.statAsync(fullPath)
                                .catch(err => console.error('Could not get stats for', fullPath, err))
                                .then(stat => {
                                    if (stat) {
                                        if (stat.isDirectory())
                                            resolve(this.crawlRecursiveAsync(fullPath));
                                        else
                                            resolve(fullPath)
                                    }
                                    else {
                                        resolve()
                                    }
                                })
                        }
                    })
                });

                return Promise.all(promises);
            })
    }

    private crawl(dir) {
        return this.crawlRecursiveAsync(dir)
            .then(foundFiles => {
                return _.filter(foundFiles, f => !!f)
            })
            .catch(err => {
                console.error('crawlRecursiveAsync', err)
            })
    }

    public getVideosAsync(folders: string[]): Promise<Video[]> {
        const asyncFunctions = [];
        _.times(folders.length, (num) => {
            asyncFunctions.push(
                callback => {
                    let folder = folders[num]
                    console.time('crawl-' + folder)
                    console.log('Crawling', folder)
                    this.crawl(folder)
                        .catch(err => {
                            console.timeEnd('crawl-' + folder)
                            console.error('Error at source folder:', folder, err)
                            callback(err)
                        })
                        .then(foundFiles => {
                            console.timeEnd('crawl-' + folder)
                            console.log('Crawling', folder, 'OK')
                            callback(null, foundFiles);
                        })
                }
            );
        });

        // TODO separate in two: crawl and video creation
        return new Promise((resolve, reject) => {
            async.parallel(asyncFunctions, (err, results) => {
                let videos = [];
                let combined = [];
                let all = [];
                _.each(results, (result: any) => combined = _.union(combined, result));
                all = _.flattenDeep(combined);
                all = _.compact(all); // some results may be undefined
                console.warn('TODO: ensure that there are no duplicate paths');
                // all = _.uniq(all);

                _.each(all, path => {
                    if (this.isVideo(path)) {
                        videos.push(new Video(path));
                    }
                });
                resolve(videos);
            })
        })
    }

    private shouldIgnoreFolder(path: string) {
        let isSystem = false;
        let i;
        for (i = 0; i < this.ignoredFolders.length; i++) {
            if (path.indexOf(this.ignoredFolders[i]) >= 0) {
                isSystem = true;
                break;
            }
        }

        return isSystem;
    }

   private isVideo(path: string) {
        if (!path)
            return false;
        return _.includes(Constants.VideoTypes, Path.extname(path).toLowerCase());
    }
}