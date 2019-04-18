import * as React from "react";
import { Icon } from '@blueprintjs/core';
import { connect } from 'react-redux'
import { ipcRenderer } from 'electron';
import { IpcEvents } from '../common/Constants.js'
import * as Helper from '../common/Helper';
import Router from '../core/Router'

interface IFooterReduxProps {
    videoCount:number
    path:string
}

class Footer extends React.Component<IFooterReduxProps, undefined> {

    render() {
        const { videoCount, path } = this.props;

        return (
            <footer>
                <span>Version { Helper.app.version() }</span>
                <span className='video-count'>{ videoCount } videos</span>
            </footer>
        );
    }
}

function mapStateToProps(state, ownProps):IFooterReduxProps {
    let videoCount = 0;
    if (state.myReducer.searchResults) {
        videoCount = state.myReducer.searchResults.videos.length;
    }
    else if (state.myReducer.videos) {
        videoCount = state.myReducer.videos.length;
    }
    return {
        videoCount: videoCount,
        path: state.myReducer.currentVideo ? state.myReducer.currentVideo.path : ''
    }
}

export default connect(mapStateToProps)(Footer)