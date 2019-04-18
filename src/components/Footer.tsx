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
    return {
        videoCount: state.myReducer.videos ? state.myReducer.videos.length : 0,
        path: state.myReducer.currentVideo ? state.myReducer.currentVideo.path : ''
    }
}

export default connect(mapStateToProps)(Footer)