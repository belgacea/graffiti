import * as React from "react";

import Screenshot from '../types/Screenshot';
import Video from '../types/Video';

interface IThumbnailProps {
    screenshot: Screenshot;
    video: Video;
    onClick?: () => void;
}

export default class Thumbnail extends React.Component<IThumbnailProps, undefined> {

    handleClick = () => {
        if (this.props.onClick) {
            this.props.onClick();
        }
    }
    
    render() {
        const video = this.props.video;
        const screen = this.props.screenshot;
        const path = video.getScreenshotFullpath(screen.path);
        return (
            <div className='screenshot'>
                <img src={path} onClick={ path ? this.handleClick : null } />
                <div className='background'></div>
                <span className='timestamp'>{screen.timestamp}</span>
            </div>
        );
    }
}
