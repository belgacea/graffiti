import * as React from "react";
import { Icon, Popover, PopoverInteractionKind, Tooltip, Position, Button, Intent } from '@blueprintjs/core';

import Router from '../core/Router'
import Video from '../types/Video';
import { ipcRenderer } from 'electron';
import { IpcEvents } from '../common/Constants.js'
import ToastHelper from '../core/ToastHelper'

interface IVideoCardProps {
    video: Video
    onClick: () => void
}

interface IVideoCardState {
    hasError:boolean
    currentScreenshotIndex?: number
}

export default class VideoCard extends React.Component<IVideoCardProps, IVideoCardState> {

    private static dynamicThumbnailEnabled = true;
    private timer;

    constructor(props: any) {
        super(props);
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

    handleMouseEnter = () => {
        if (!VideoCard.dynamicThumbnailEnabled)
            return;

        if (this.timer)
            return;

        this.timer = setInterval(() => {
            const {video} = this.props;
            let currentScreenshotIndex = this.state.currentScreenshotIndex === undefined ? -1 : this.state.currentScreenshotIndex;
            if (currentScreenshotIndex === video.screenshots.length -1) {
                currentScreenshotIndex = 0;
            }
            else {
                currentScreenshotIndex++;
            }
            
            this.setState({ currentScreenshotIndex });
        }, 400);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    handleMouseLeave = () => {
        if (!VideoCard.dynamicThumbnailEnabled)
            return;

            clearInterval(this.timer);
            this.timer = undefined;
            this.setState({ currentScreenshotIndex: undefined });
    }

    render() {
        const {video} = this.props;
        const {hasError, currentScreenshotIndex} = this.state;
        const screen = currentScreenshotIndex === undefined ? video.getMainScreen() : video.getScreen(currentScreenshotIndex);
        
        return (
            // <Popover
            //     interactionKind={PopoverInteractionKind.HOVER}
            //     popoverClassName="pt-popover-content-sizing"
            //     position={Position.BOTTOM}
            //     content={this.renderPopoverContent()}
            // >
            <Tooltip content={ video.getName() } position={Position.TOP_LEFT}>
                <div className="pt-card pt-elevation-0 pt-interactive video-card" 
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                     onClick={ this.handleClick }>
                    {
                        screen && !hasError ?
                        <img src={ screen }
                            onError={ this.handleError }  />
                        :
                        <Icon icon='media' className='no-image' />
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