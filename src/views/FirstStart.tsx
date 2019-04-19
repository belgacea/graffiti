import * as React from "react";
import { ipcRenderer } from 'electron';

import { ProgressBar, Checkbox } from '@blueprintjs/core';

import WatchedFolders from '../components/WatchedFolders';
import AppSettings from '../types/AppSettings';
import Folder from '../types/Folder';

const electron = require('electron')
const remote = electron.remote
const dialog = remote.dialog

import { IpcEvents } from '../common/Constants.js'
import * as Helper from '../common/Helper'

interface IFirstStartState {
    step:number
    progress:number
    watchedFolders:Folder[]
    thumbnailFolder:string
    pictureFolder:string
    startScreenshotOnStartup:boolean
    makeScreenshotsOnDetails:boolean
}

interface IFirstStateProps {
    onFinished: () => void;
}

export default class FirstStart extends React.Component<IFirstStateProps, IFirstStartState> {

    constructor(props: any) {
        super(props);

        const appSettings:any = remote.getGlobal('appSettings');
        
        let folders:Folder[] = [];
        
        const defaultSettings = new AppSettings();
        this.state = {
            step: 1,
            progress: 0,
            watchedFolders: folders,
            thumbnailFolder: appSettings.ThumbnailFolder,
            pictureFolder: appSettings.PictureFolder,
            startScreenshotOnStartup: defaultSettings.StartScreenshotOnStartup,
            makeScreenshotsOnDetails: defaultSettings.MakeScreenshotsOnDetails
        };

        ipcRenderer.on(IpcEvents.Startup.FirstStart.Progress, (event: any, progress:number) => {
            this.setState({progress});
        });
    }

    selectThumbnailFolder() {
        let callback = (folders:any) => {
            let thumbnailFolder = folders ? folders[0] : undefined;
            if (thumbnailFolder) {
                this.setState({thumbnailFolder})
            }
        }
        const mainWindow = remote.getGlobal('mainWindow');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
          }, callback)
    }

    selectPictureFolder() {
        let callback = (folders:any) => {
            let pictureFolder = folders ? folders[0] : undefined;
            if (pictureFolder) {
                this.setState({pictureFolder})
            }
        }
        const mainWindow = remote.getGlobal('mainWindow');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
          }, callback)
    }

    handleThumbnailFolderChanged(event: any) {
        this.setState({ thumbnailFolder: event.target.value });
    }

    handlePictureFolderChanged = (event: any) => {
        this.setState({ pictureFolder: event.target.value });
    }

    onWatchedFoldersChanged(watchedFolders:Folder[]) {
        this.setState({watchedFolders})
    }

    onStartScreenshotOnStartupChanged(e) {
        let {startScreenshotOnStartup} = this.state;
        startScreenshotOnStartup = !startScreenshotOnStartup;
        this.setState({startScreenshotOnStartup})
    }

    onMakeScreenshotsOnDetailsChanged(e) {
        let {makeScreenshotsOnDetails} = this.state;
        makeScreenshotsOnDetails = !makeScreenshotsOnDetails;
        this.setState({makeScreenshotsOnDetails})
    }

    previousStep = () => {
        this.setState({ step: this.state.step - 1 });
    }

    nextStep = async () => {
        let step = this.state.step + 1;
        this.setState({step: step});

        if (step === 3) {
            let appSettings = new AppSettings();
            appSettings.ThumbnailFolder = this.state.thumbnailFolder;
            appSettings.PictureFolder = this.state.pictureFolder;
            appSettings.WatchedFolders = this.state.watchedFolders;
            appSettings.StartScreenshotOnStartup = this.state.startScreenshotOnStartup;
            appSettings.MakeScreenshotsOnDetails = this.state.makeScreenshotsOnDetails;
            appSettings.setDatabaseVersion();
            
            const globalAppSettings:any = remote.getGlobal('appSettings');
            globalAppSettings.ThumbnailFolder = appSettings.ThumbnailFolder;

            ipcRenderer.on(IpcEvents.Startup.FirstStart.FinishedIndexing, (event: any, files:string[]) => {
                this.setState({step: 4});
                this.props.onFinished();
                console.timeEnd('indexing');
            
                if (this.state.startScreenshotOnStartup) {
                    ipcRenderer.send(IpcEvents.Background.ScreenshotStartAll, appSettings);
                }
            });
            console.time('indexing');
            ipcRenderer.send(IpcEvents.Startup.FirstStart.BeginIndexing, appSettings);
        }
    }

    render() {
        let divStep;
        let canGoNext = false;
        switch (this.state.step) {
            case 1:
                canGoNext = this.state.watchedFolders.length >= 1;
                divStep = this.renderChooseWatchedFolders();
                break;
            case 2:
                canGoNext = true;
                divStep = this.renderChooseImageFolders();
                break;
            case 3:
                canGoNext = true;
                divStep = this.renderProgress();
                break;
            case 4:
                canGoNext = true;
                divStep = this.renderFinished();
                break;
        }

        return (
            <div id='first-start' className="pt-card">
                { /* <h5></h5> */ }
                { /* <p></p> */ }
                { divStep }
                {
                    this.state.step > 1 && this.state.step < 3 ?
                    <button type="button" disabled={!canGoNext} className="pt-button previous" onClick={ this.previousStep }>
                        <span className="standard arrow-left"></span>
                        Previous
                    </button>
                : null
                }
                {
                    this.state.step < 3 ?
                        <button type="button" disabled={!canGoNext} className="pt-button pt-intent-success next" onClick={ this.nextStep }>
                            Next
                            <span className="standard arrow-right pt-align-right"></span>
                        </button>
                    : null
                }
            </div>
        );
    }

    renderChooseWatchedFolders() {
        return (
            <div>
                <WatchedFolders folders={ this.state.watchedFolders } onChange={ this.onWatchedFoldersChanged.bind(this) } />
                <Checkbox
                        checked={ this.state.startScreenshotOnStartup } 
                        onChange={ this.onStartScreenshotOnStartupChanged.bind(this) }
                        label='Start generating screenshots on startup' />
                <Checkbox
                        checked={ this.state.makeScreenshotsOnDetails } 
                        onChange={ this.onMakeScreenshotsOnDetailsChanged.bind(this) }
                        label='Make screenshots when opening the video details' />
            </div>
        );
    }

    renderChooseImageFolders() {
        /* Warning: FirstStart is changing an uncontrolled input of type text to be controlled.
        Input elements should not switch from uncontrolled to controlled (or vice versa).
        Decide between using a controlled or uncontrolled input element for the lifetime of the component.
        More info: https://fb.me/react-controlled-components */
        return (
            <div>
                <span>Where do you want save the screenshots?</span>
                <br/>
                <input className="pt-input thumbnail-folder" type="text" value={this.state.thumbnailFolder} onChange={this.handleThumbnailFolderChanged.bind(this)} dir="auto" />
                <button type="button" className="pt-button add" onClick={this.selectThumbnailFolder.bind(this)}>Browse</button>
                <br/>
                <br/>
                <span>Where do you want save the people's pictures?</span>
                <br/>
                <input className="pt-input thumbnail-folder" type="text" value={this.state.pictureFolder} onChange={this.handlePictureFolderChanged} dir="auto" />
                <button type="button" className="pt-button add" onClick={this.selectPictureFolder.bind(this)}>Browse</button>
                <br/>
            </div>
        );
    }

    renderProgress() {
        const progress = this.state.progress === 0 ? 0 : this.state.progress / 100;
        return (
            <div>
                Indexing the folders... ({ this.state.progress }%)
                <br />
                <ProgressBar value={ progress } />
                <br />
                { this.state.startScreenshotOnStartup ? <p>Once the indexing is done, the screenshot generation will start in the background.</p> : null }
            </div>
        );
    }

    renderFinished() {
        return (
            <div>
                Index complete
            </div>
        );
    }
}