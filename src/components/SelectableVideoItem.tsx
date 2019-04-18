import * as React from "react"
import * as _ from 'lodash'
import { ipcRenderer } from 'electron';
import { Checkbox } from '@blueprintjs/core'
import Video from "../types/Video";
import Router from "../core/Router";
import { IpcEvents } from '../common/Constants.js'
import { SelectableVideo } from "../types/MaintenanceTypes";
import FileExistenceIndicator from '../components/FileExistenceIndicator';

interface ISelectableVideoItemProps {
    selectableVideo: SelectableVideo
    onSelected: (selectableVideo: SelectableVideo, isSelected: boolean) => void
}

interface ISelectableVideoItemState {
    isSelected: boolean
    videoExists?: boolean
}

export default class SelectableVideoItem extends React.Component<ISelectableVideoItemProps, ISelectableVideoItemState> {
    private willUnmount: boolean;

    constructor(props: ISelectableVideoItemProps) {
        super(props);
        
        const {selectableVideo} = props;
        this.state = {
            isSelected: selectableVideo.isSelected,
        }
    }

    play = (video) => {
        ipcRenderer.send(IpcEvents.Playback.Play, video);
    }

    handleOpenContainingFolder = (video: Video) => {
        ipcRenderer.send(IpcEvents.Video.OpenContainingFolder, video.path)
    }

    toggleSelected = () => {
        const isSelected = !this.state.isSelected;
        this.props.onSelected(this.props.selectableVideo, isSelected)
        this.props.selectableVideo.isSelected = isSelected;
        this.setState({isSelected})
    }

    componentWillUnmount() {
        this.willUnmount = true;
    }

    render() {
        const { isSelected, videoExists } = this.state;
        const { selectableVideo } = this.props;
        return (
            <div className={isSelected ? 'duplicate-info-container selected' : 'duplicate-info-container'} onClick={this.toggleSelected}>
                <Checkbox checked={isSelected} onChange={() => { }} />
                <img src={selectableVideo.getMainScreen()} />
                <FileExistenceIndicator path={selectableVideo.path} />
                <button className="pt-button pt-minimal pt-icon-play" onClick={(e) => { this.play(selectableVideo); e.stopPropagation(); }} ></button>
                <button className="pt-button pt-minimal pt-icon-search" onClick={(e) => { Router.to.VideoDetails(selectableVideo._id); e.stopPropagation(); }} ></button>
                <button className="pt-button pt-minimal pt-icon-folder-open" onClick={(e) => { this.handleOpenContainingFolder(selectableVideo); e.stopPropagation(); }}></button>
                <span>{selectableVideo.path}</span>
            </div>
        );
    }
}