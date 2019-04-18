import * as React from 'react';
import * as _ from 'lodash';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';

import VideoGrid from '../components/VideoGrid';
// import VideoCard from '../components/VideoCard';

import Persistence from '../core/Persistence';
import Video from '../types/Video';

interface IVideoListProps {
    videos?: Video[]
}

interface IVideoListState {
    // videos: any[]
}

class VideoList extends React.Component<IVideoListProps, IVideoListState> {
    public static scrollY:number = 0;
    
    constructor() {
        super();
        // this.state = {
        //     videos: []
        // };
        
        // new Persistence().getAll(Video.TYPE).then((videos:Video[]) => {
        //     this.setState({videos: videos});
        // })
    }

    // componentDidUpdate() {
    //     document.getElementById('video-grid').scrollTop = VideoGrid.scrollY
    // }

    // componentWillUnmount() {
    //     VideoGrid.scrollY = document.getElementById('video-grid').scrollTop
    // }

    // renderVideoCard(video:Video, index:number) {
    //     return <VideoCard key={video._id} video={video} />;
    // }

    render() {
        const videos = this.props.videos || []
        return (
            <div id="video-list">
                <VideoGrid videos={ videos } />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        videos: state.myReducer.videos
    }
}

export default connect(mapStateToProps)(VideoList)