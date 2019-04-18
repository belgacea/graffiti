import * as React from "react";
import { Icon, Popover, PopoverInteractionKind, Tooltip, Position, Button, Intent } from '@blueprintjs/core';

import Router from '../core/Router'
import Video from '../types/Video';
import { ipcRenderer } from 'electron';
import { IpcEvents } from '../common/Constants.js'

interface IVideoCardProps {
    video: Video
    onClick: () => void
}

interface IVideoCardState {
    hasError:boolean
}

export default class VideoCard extends React.Component<IVideoCardProps, IVideoCardState> {

    constructor() {
        super();
        this.state = {
            hasError: false
        }
    }

    handleClick = () => {
        if (this.props.onClick) {
            this.props.onClick();
        }
        Router.to.VideoDetails(this.props.video._id);
    }

    play = () => {
        ipcRenderer.send(IpcEvents.Playback.Play, this.props.video);
    }

    handleError = (e) => {
        console.error('Erreur de thumbnail', e)
        this.setState({ hasError: true });
    }

    render() {
        const video = this.props.video;
        const hasError = this.state.hasError;
        const mainScreen = video.getMainScreen();
        return (
            // <Popover
            //     interactionKind={PopoverInteractionKind.HOVER}
            //     popoverClassName="pt-popover-content-sizing"
            //     position={Position.BOTTOM}
            //     content={this.renderPopoverContent()}
            // >
            <Tooltip content={ video.getName() } position={Position.TOP_LEFT}>
                <div className="pt-card pt-elevation-0 pt-interactive video-card" 
                     onClick={ this.handleClick }>
                    {
                        mainScreen && !hasError ?
                        <img src={ mainScreen }
                            onError={ this.handleError }  />
                        :
                        <Icon iconName='pt-icon-media' className='no-image' />
                    }
                </div>
            </Tooltip>
            // </Popover>
        );
    }

    renderPopoverContent() {
        return (
            <div>
                <h5>{this.props.video.getName()}</h5>
                <Button intent={Intent.PRIMARY} onClick={ this.play }>Play</Button>
            </div>
        );
    }
}