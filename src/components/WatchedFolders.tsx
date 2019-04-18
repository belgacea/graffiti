import * as React from "react";
import * as _ from "lodash";
import Folder from "../types/Folder";
import { Checkbox, Tooltip, Position } from '@blueprintjs/core'
import * as Analytics from '../common/Analytics';

const electron = require('electron')
const remote = electron.remote
const dialog = remote.dialog

interface IWatchedFoldersState {
    folders?: Folder[]
    selectedFolderIndex?: number
}

interface IWatchedFoldersProps {
    folders: Folder[]
    onChange?: (WatchedFolders:Folder[]) => void
}

export default class WatchedFolders extends React.Component<IWatchedFoldersProps, IWatchedFoldersState> {

    constructor(props:IWatchedFoldersProps) {
        super(props);
        this.state = {
            folders: props.folders,
            selectedFolderIndex: undefined
        };
    }

    componentWillReceiveProps(nextProps:IWatchedFoldersProps) {
        this.setState({folders: nextProps.folders});
    }

    selectDirectory() {
        let callback = (folders:string[]) => {
            let selectedFolder = folders ? folders[0] : undefined;
            if (selectedFolder) {
                let {folders} = this.state;
                if (!_.find(folders, f => f.path === selectedFolder)) {
                    folders.push(new Folder(selectedFolder));
                    this.setState({folders: folders})
                    if (this.props.onChange) {
                        this.props.onChange(folders);
                    }
                    Analytics.events.SETTINGS_VIDEOS_FOLDER_ADD();
                }
                else {
                    console.log(selectedFolder, 'already in list')
                }
            }
        }
        const mainWindow = remote.getGlobal('mainWindow');
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
          }, callback)
    }

    deleteDirectory(index:number) {
        const {folders} = this.state;
        if (index > -1) {
            folders.splice(index, 1);
            this.setState({folders: folders})
            this.props.onChange(folders);
            Analytics.events.SETTINGS_VIDEOS_FOLDER_REMOVE();
        }
    }

    onCheckedChanged = (folder:Folder) => {
        let folders = this.state.folders || [];
        folders = [...folders];
        folder = _.find(folders, f => f.path === folder.path);
        folder.autoRefresh = !folder.autoRefresh;
        this.setState({folders});
        this.props.onChange(folders)
    }

    render() {
        const folderElements = !this.state.folders ? null : this.state.folders.map((folder, index) => 
                        <div key={index} className='folder'>
                            <button type="button" className="pt-button pt-intent-danger" onClick={ this.deleteDirectory.bind(this, index) }>Remove
                                <span className="pt-icon-standard pt-icon-trash pt-align-right"></span>
                            </button>
                            <span className='path'>{ folder.path }</span>
                            <Tooltip className='auto-update' content='Look for new files when I start the app' position={Position.LEFT}>
                                <Checkbox
                                    className=''
                                    checked={folder.autoRefresh}
                                    onChange={() => this.onCheckedChanged(folder) } />
                            </Tooltip>
                        </div>);
        return (
                <div id='watched-folders'>
                    <p>Choose the folders you want to analyze.</p>
                    <button type="button" className="pt-button pt-icon-add" onClick={this.selectDirectory.bind(this)}>Browse</button>
                    <div className='list'>
                        { folderElements }
                    </div>
                </div>
        );
    }
}