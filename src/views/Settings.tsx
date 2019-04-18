import * as React from "react"
import * as _ from 'lodash'
import { Checkbox, Menu, MenuItem, MenuDivider } from '@blueprintjs/core'

import Persistence from '../core/Persistence'
import AppSettings from '../types/AppSettings'
import WatchedFolders from '../components/WatchedFolders'
import ToastHelper from '../core/ToastHelper'
import Folder from "../types/Folder";
import * as Analytics from '../common/Analytics';

const electron = require('electron')
const remote = electron.remote
const dialog = remote.dialog

interface ISettingsState {
    settings?: AppSettings
    activeMenu: number
    enableCrawl?: boolean
}

const MENU_VIDEOS = 0;
const MENU_IMAGES = 1;

export default class Settings extends React.Component<any, ISettingsState> {

    constructor() {
        super();

        this.state = { activeMenu: MENU_VIDEOS };
        new Persistence().getSettings().then((settings: AppSettings) => {
            this.setState({ settings })
            this.refreshEnableCrawl(settings);
    });
    }

    save(settings) {
        new Persistence().update(settings).then(() => {
            ToastHelper.success('Settings saved', 'settings')
            this.setState({ settings: _.clone(settings) })
        });
    }

    selectFolder(apply) {
        let callback = (folders: any) => {
            let folder = folders ? folders[0] : undefined;
            if (folder) {
                apply(folder)
            }
        }
        const mainWindow = remote.getGlobal('mainWindow');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        }, callback)
    }

    onStartScreenshotOnStartupChanged(e) {
        const { settings } = this.state;
        settings.StartScreenshotOnStartup = !settings.StartScreenshotOnStartup;
        this.save(settings);
        Analytics.events.SETTINGS_IMAGES_STARTUP_MAKE_SCREEENSHOTS(settings.StartScreenshotOnStartup);
    }

    onMakeScreenshotsOnDetailsChanged(e) {
        const { settings } = this.state;
        settings.MakeScreenshotsOnDetails = !settings.MakeScreenshotsOnDetails;
        this.save(settings);
        Analytics.events.SETTINGS_IMAGES_SCREENSHOTS_MAKE_ON_DETAILS(settings.MakeScreenshotsOnDetails);
    }

    onIsWatcherEnabledChanged = e => {
        const { settings } = this.state;
        settings.IsWatcherEnabled = !settings.IsWatcherEnabled;
        new Persistence().update(settings).then(() => {
            ToastHelper.success('Settings saved', 'settings')
            this.setState({ settings: settings })
            if (settings.IsWatcherEnabled) {
                console.warn('TODO: start watcher')
            }
            else {
                console.warn('TODO: stop watcher')
            }
        });
        Analytics.events.SETTINGS_VIDEOS_REALTIME(settings.IsWatcherEnabled);
    }

    toggleEnableFileDiscovery = () => {
        const { settings, enableCrawl } = this.state;
        let newValue = !enableCrawl;
        
        _.each(settings.WatchedFolders, f => {
            f.autoRefresh = newValue;
        });
        this.save(settings);
        this.setState({ enableCrawl: newValue });

        Analytics.events.SETTINGS_VIDEOS_STARTUP_CRAWL(newValue);
    }

    onBackgroundParallelScreenshotChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { settings } = this.state;
        const value = parseInt(e.target.value);

        if (isNaN(value)) {
            return;
        }
        if (value > 16) {
            ToastHelper.error('Value is too high. Max is 16.');
            return;
        }
        if (value < 1) {
            ToastHelper.error('Value is too low. Min is 1.');
            return;
        }

        settings.BackgroundParallelScreenshot = value;
        this.save(settings);
        Analytics.events.SETTINGS_IMAGES_SCREENSHOTS_PARALLEL(settings.BackgroundParallelScreenshot);
    }

    onThumbnailFolderChanged = (folder: string) => {
        const { settings } = this.state;
        settings.ThumbnailFolder = folder;
        this.save(settings);
        Analytics.events.SETTINGS_IMAGES_SCREENSHOTS_PATH_CHANGED();
    }

    onPictureFolderChanged = (folder: string) => {
        const { settings } = this.state;
        settings.PictureFolder = folder;
        this.save(settings);
        Analytics.events.SETTINGS_IMAGES_PEOPLE_PATH_CHANGED();
    }

    onWatchedFoldersChanged = (watchedFolders: Folder[]) => {
        const { settings } = this.state;
        settings.WatchedFolders = watchedFolders;
        this.save(settings);
        this.refreshEnableCrawl(settings);
    }

    refreshEnableCrawl = (settings: AppSettings) => {
        const allTrue = settings.WatchedFolders.every(f => f.autoRefresh === true);
        const allFalse = settings.WatchedFolders.every(f => f.autoRefresh === false);
        let enableCrawl;
        if (allTrue) {
            this.setState({ enableCrawl: true })
        }
        else if (allFalse) {
            this.setState({ enableCrawl: false })
        }
        else {
            this.setState({ enableCrawl: undefined })
        }
    }

    renderImageSettings(settings: AppSettings) {
        return (
            <div>
                <span>Where do you want save the people's pictures?</span>
                <input className="pt-input"
                    style={{ width: '80%' }}
                    type="text" readOnly
                    value={settings.PictureFolder}
                />
                <button type="button" className="pt-button pt-icon-add" onClick={() => this.selectFolder(this.onPictureFolderChanged)}>Browse</button>
                <br /><br />

                <span>Where do you want save the screenshots?</span>
                <input className="pt-input"
                    style={{ width: '80%' }}
                    type="text" readOnly
                    value={settings.ThumbnailFolder}
                />
                <button type="button" className="pt-button pt-icon-add" onClick={() => this.selectFolder(this.onThumbnailFolderChanged)}>Browse</button>
                <br /><br />

                <Checkbox
                    checked={settings.MakeScreenshotsOnDetails}
                    onChange={this.onMakeScreenshotsOnDetailsChanged.bind(this)}
                    label='Make screenshots when opening the video details' />
                <Checkbox
                    checked={settings.StartScreenshotOnStartup}
                    onChange={this.onStartScreenshotOnStartupChanged.bind(this)}
                    label='Start generating screenshots on startup' />

                <span>Number of parallel screenshot generation in the background</span>
                <input className="pt-input background-screenshots" type="text" value={settings.BackgroundParallelScreenshot} onChange={this.onBackgroundParallelScreenshotChanged} dir="auto" />
            </div>
        );
    }

    renderFileSettings(settings: AppSettings) {

        return (
            <div>
                <WatchedFolders folders={settings.WatchedFolders} onChange={this.onWatchedFoldersChanged} />
                {/* <Checkbox
                    checked={settings.IsWatcherEnabled}
                    onChange={this.onIsWatcherEnabledChanged}
                    label='Enable real time detection' /> */}
                <Checkbox
                    checked={this.state.enableCrawl}
                    indeterminate={this.state.enableCrawl === undefined}
                    onChange={this.toggleEnableFileDiscovery}
                    label='Look for new files on startup' />
            </div>
        );
    }

    renderMenu(activeMenu: number) {
        return (
            <Menu>
                <MenuItem
                    iconName="pt-icon-mobile-video"
                    className={activeMenu === MENU_VIDEOS ? 'pt-active' : undefined}
                    onClick={() => this.setState({ activeMenu: MENU_VIDEOS })}
                    text="Videos"
                />
                <MenuItem
                    iconName="pt-icon-media"
                    className={activeMenu === MENU_IMAGES ? 'pt-active' : undefined}
                    onClick={() => this.setState({ activeMenu: MENU_IMAGES })}
                    text="Images"
                />
                {/* <MenuDivider /> */}
            </Menu>
        );
    }

    render() {
        const { settings, activeMenu } = this.state;
        if (!settings) {
            return null;
        }
        let renderedSettings = null;
        switch (activeMenu) {
            case MENU_VIDEOS:
                renderedSettings = this.renderFileSettings(settings);
                break;
            case MENU_IMAGES:
                renderedSettings = this.renderImageSettings(settings);
                break;
        }
        return (
            <div id='settings' className='pt-card'>
                <div id="menu">
                    {this.renderMenu(activeMenu)}
                </div>
                <div id="active-settings">
                    {renderedSettings}
                </div>
            </div>
        );
    }
}