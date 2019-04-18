import * as React from 'react';
import * as _ from 'lodash';
import * as ReactList from 'react-list';

import VideoCard from './VideoCard';

import Video from '../types/Video';

interface IVideoGridProps {
    videos: Video[]
}

export default class VideoGrid extends React.Component<IVideoGridProps, undefined> {
    public static scrollY:number = 0;
    public static lastIndex:number = 0; // TODO: move to VideoList (because this component is also used in PersonDetails)

    private videoElements:any; // TODO: remove: I use the prop initialIndex, not this.videoElements.scrollTo method

    constructor() {
        super();
    }

    componentDidMount() {
        // this.videoElements.scrollTo(VideoGrid.lastIndex)
    }

    handleClicked = (index) => {
        VideoGrid.lastIndex = index
    }

    renderVideoCard = (video:Video, index:number) => {
        return <VideoCard key={video._id} video={video} onClick={ () => this.handleClicked(index) } />;
    }

    renderItem = (index, key) => {
        const videos = this.props.videos || []
        
        if (videos.length === 0)
            return null;

        return this.renderVideoCard(videos[index], index);
    }
    
    handleScroll = () => {
        // console.log('scrolling');
        // console.log(this.videoElements.getVisibleRange());
    }

    render() {
        const videos = this.props.videos || []
        this.videoElements = <ReactList
            initialIndex={ VideoGrid.lastIndex }
            itemRenderer={ this.renderItem }
            length={ videos.length }
            ref={ ref => { this.videoElements = ref } } 
            type='uniform'
            // useStaticSize={true}
        />
    
        return (
            <div id="video-grid" onScroll={this.handleScroll}>
				{ this.videoElements }
            </div>
        );
    }
}
