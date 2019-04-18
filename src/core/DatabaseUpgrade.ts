import * as _ from 'lodash'
import Persistence from "./Persistence";
import AppSettings from "../types/AppSettings";
import Folder from '../types/Folder';

export default class DatabaseUpgrade {

    /*
        TODO: Not good: upgrades must be chained.
    */
    public static Verify() {
        console.log("DatabaseUpgrade.Verify")
        return new Promise((resolve, reject) => {
            const db = new Persistence()
            db.getSettings().then(jsonSettings => {
                const settings = new AppSettings();
                _.merge(settings, jsonSettings);
                
                console.log('settings', settings)
                if (settings.getDatabaseVersion() === AppSettings.LATEST_DATABASE_VERSION) {
                    resolve();
                }
                else {
                    let currentVersion = settings.getDatabaseVersion() || 0;
                    while (currentVersion < AppSettings.LATEST_DATABASE_VERSION) {
                        let upgrade = _.find(DatabaseUpgrade.Upgrades, d => d.from === currentVersion);
                        if (upgrade) {
                            upgrade.execute.map(e => e(upgrade).then(() => resolve())) // TODO: resolve should be call after all upgrades have finished
                            currentVersion = upgrade.to;
                        }
                        else {
                            currentVersion++
                        }
                    }
    
                    // db.setFieldsByType(AppSettings.TYPE, { databaseVersion: AppSettings.LATEST_DATABASE_VERSION })
                    // .then(() =>  resolve())
                    // .catch(err => console.error(err))
                }
            })
        });
    }

    private static changeTypeWatchedFolder = (upgrade:any) => {
        console.log('DatabaseUpgrade.changeTypeWatchedFolder');
        // from string[] to Folder[]
        return new Promise((resolve, reject) => {
            const db = new Persistence()
            db.getSettings().then(jsonSettings => {
                const settings = new AppSettings();
                _.merge(settings, jsonSettings);
                settings.setDatabaseVersion(upgrade.to); // TODO: does not belong here

                const autoRefresh = settings['CrawlOnStartup'];
                const watchedFolders: any[] = settings.WatchedFolders || []
                settings.WatchedFolders = watchedFolders.map(path => new Folder(path, autoRefresh))
                console.log('new settings:',settings)
                db.update(settings).then(() => {
                    console.log('DatabaseUpgrade.changeTypeWatchedFolder: done')
                    resolve();
                })
            })
        })
    }

    private static Upgrades = [
        { from: 0, to: 1, execute: [DatabaseUpgrade.changeTypeWatchedFolder] }
    ]
}