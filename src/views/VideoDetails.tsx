import * as React from 'react';
import * as _ from 'lodash';
import * as fs from 'fs'
import * as Path from 'path'
import * as filesize from 'filesize';
import { ipcRenderer } from 'electron';
import { Icon, Button, Popover, PopoverInteractionKind, Tooltip, Position, Intent, Menu, MenuItem, MenuDivider, NonIdealState } from '@blueprintjs/core';

import { connect } from 'react-redux'
import * as myActions from '../redux/Actions'
import * as Util from '../common/Util'
import * as Mousetrap from 'mousetrap'

import Router from '../core/Router'
import Video from '../types/Video';
import Person from '../types/Person';
import Screenshot from '../types/Screenshot';
import Thumbnail from '../components/Thumbnail';
import PersonCircle from '../components/PersonCircle';
import SuggestiveInput from '../components/SuggestiveInput';
import FileExistenceIndicator from '../components/FileExistenceIndicator';
import AttachPeopleModal from '../modal/AttachPeopleModal';
import ConfirmAlert from '../modal/ConfirmAlert'
import VideoStore from '../store/VideoStore'
import Persistence from '../core/Persistence';
import ToastHelper from '../core/ToastHelper';

import * as Analytics from '../common/Analytics';
import { IpcEvents } from '../common/Constants'
import RenameModal from '../modal/RenameModal';

interface IVideoDetailsReduxProps {
    video: Video;
    people: Person[],
    nextVideoId: string
    previousVideoId: string
}

interface IVideoDetailsReduxActions {
    load?: (videoId: string) => void
    saveAttachedPeople?: (video: Video, newPeople: Person[]) => void
    markFavorite?: (video: Video, isFavorite: boolean) => void
    replaceVideos?: (videos: Video[]) => void
}

interface IVideoDetailsProps extends IVideoDetailsReduxActions, IVideoDetailsReduxProps {
    videoId: string;
}

interface IVideoDetailsState {
    isModalAttachPeopleOpen: boolean
    isModalRenameOpen: boolean
    tags: string[],
    isDeleteConfirmationOpen: boolean
    deleteConfirmationData: Video
    videoPath?: string // only for FileExistence because it doesn't update all the time, TODO investigate
}

class VideoDetails extends React.Component<IVideoDetailsProps, IVideoDetailsState> {

    private screenshotsSentForVideoId: string;

    constructor(props: IVideoDetailsProps) {
        super(props);
        // console.log('VideoDetails.constructor')
        this.state = {
            isModalAttachPeopleOpen: false,
            isModalRenameOpen: false,
            tags: [],
            isDeleteConfirmationOpen: false,
            deleteConfirmationData: props.video
        };
    }

    componentDidMount() {
        const onEnter = () => {
            if (this.state.isDeleteConfirmationOpen) {
                this.handleRecycleConfirmed(this.state.deleteConfirmationData)
            }
            else {
                this.play()
            }
        }
        // console.log('VideoDetails.componentDidMount')
        ipcRenderer.on(IpcEvents.Screenshot.CreatedVideo, this.onScreenshotCreated);
        this.props.load(this.props.videoId);
        Mousetrap.bind('del', () => { this.recycle() });
        Mousetrap.bind('enter', onEnter);
        Mousetrap.bind('space', onEnter);
        Mousetrap.bind('p', () => { this.previous() });
        Mousetrap.bind('v', () => { this.previous() });
        Mousetrap.bind('n', () => { this.next() });
        Mousetrap.bind('ctrl+e', () => { this.handleOpenContainingFolder(null) });
        Mousetrap.bind('f2', () => { this.handleRename() });
    }

    componentWillUnmount() {
        ipcRenderer.removeListener(IpcEvents.Screenshot.CreatedVideo, this.onScreenshotCreated);
        Mousetrap.unbind('del');
        Mousetrap.unbind('enter');
        Mousetrap.unbind('space');
        Mousetrap.unbind('p');
        Mousetrap.unbind('v');
        Mousetrap.unbind('n');
        Mousetrap.unbind('ctrl+e');
        Mousetrap.unbind('f2');
    }

    onScreenshotCreated = (event: any, videoScreenshots: Video) => {
        console.log(IpcEvents.Screenshot.CreatedVideo, videoScreenshots._id)
        this.props.replaceVideos([videoScreenshots])
    }

    recycle = () => {
        if (!this.props.video.deleted) {
            this.setState({ isDeleteConfirmationOpen: true, deleteConfirmationData: this.props.video });
        }
    }

    restore = () => {
        const { video } = this.props;
        if (video.deleted) {
            new Persistence().setFields(video._id, { deleted: false })
                .then(() => {
                    video.deleted = undefined;
                    this.props.replaceVideos([video])
                    ToastHelper.success('Video restored.');
                });
        }
    }

    handleRecycleConfirmed = (video: Video) => {
        Analytics.events.VIDEO_REMOVE();
        ToastHelper.info('Deleting...');
        this.setState({ isDeleteConfirmationOpen: false, deleteConfirmationData: undefined });

        new Persistence().setFields(video._id, { deleted: true })
            .then(() => {
                video.deleted = true;
                this.props.replaceVideos([video])
                console.log('db updated: deleted', video._id);

                Util.recycleFile(video.path)
                    .then(() => {
                        ToastHelper.success('Video removed.');
                    })
                    .catch(() => {
                        ToastHelper.error('Could not remove the video.')
                    });
            });
    }


    handleRename = () => {
        this.setState({ isModalRenameOpen: true });
    }

    async componentWillReceiveProps(nextProps: IVideoDetailsProps) {
        // console.log('VideoDetails.componentWillReceiveProps', (nextProps.video ? nextProps.video.path : undefined))
        const { video } = nextProps;

        if (video && video.hasMissingScreenshots()) {
            if (this.screenshotsSentForVideoId !== video._id) {
                const db = new Persistence();
                const settings = await db.getSettings();
                if (settings.MakeScreenshotsOnDetails) {
                    this.screenshotsSentForVideoId = video._id;
                    console.log('VideoDetails: sending', IpcEvents.Background.ScreenshotsOneVideo);
                    ipcRenderer.send(IpcEvents.Background.ScreenshotsOneVideo, video);
                    ToastHelper.info('Making screenshots...', 'video-details-screenshots');
                }
            }
        }
        if (video && video.tags) {
            this.setState({ tags: video.tags })
        }
        else {
            this.setState({ tags: [] })
        }

        if (video) {
            console.log(video.getName(), video.hash);
            this.setState({ videoPath: video.path });
        }
    }

    play = () => {
        ipcRenderer.send(IpcEvents.Playback.Play, this.props.video);
    }

    markFavorite = async () => {
        const { video, markFavorite } = this.props;
        markFavorite(video, !video.isFavorite);
    }

    openAttachPersonModal = () => {
        this.setState({ isModalAttachPeopleOpen: true });
    }

    handleSavePeople = async (newPeople: Person[]) => {
        this.setState({ isModalAttachPeopleOpen: false });
        this.props.saveAttachedPeople(this.props.video, newPeople);
    }

    previous = () => {
        if (this.props.previousVideoId) {
            Router.to.VideoDetails(this.props.previousVideoId);
            this.props.load(this.props.previousVideoId);
        }
    }

    next = () => {
        if (this.props.nextVideoId) {
            Router.to.VideoDetails(this.props.nextVideoId);
            this.props.load(this.props.nextVideoId);
        }
    }

    renderThumbnail = (screenshot: Screenshot, index: number) => {
        return <Thumbnail key={screenshot.timestamp} screenshot={screenshot} video={this.props.video} onClick={this.play} />
    }

    renderPerson = (person: Person, index: number) => {
        return <PersonCircle key={person._id} person={person} size='medium' />;
    }

    renderPopoverContent() {
        return (
            <Menu>
                <MenuItem
                    iconName="pt-icon-folder-open"
                    onClick={this.handleOpenContainingFolder}
                    text="Open containing folder"
                />
                <MenuItem
                    iconName="pt-icon-media"
                    onClick={this.handleMakeScreenshots}
                    text="Make screenshots"
                />
                <MenuItem
                    iconName="pt-icon-annotation"
                    onClick={this.handleRename}
                    text="Rename"
                />
                {
                    this.props.video.deleted ?
                        <MenuItem
                            iconName="pt-icon-trash"
                            onClick={this.restore}
                            text="Restore"
                        />
                        :
                        <MenuItem
                            iconName="pt-icon-trash"
                            onClick={this.recycle}
                            text="Remove"
                        />
                }
            </Menu>
        );
        // <MenuDivider />
        // <MenuItem text="Settings..." iconName="cog" />
    }

    renderTags() {
        const { video } = this.props;
        const { tags } = this.state;

        const handleChange = tags => {
            video.tags = tags
            new Persistence().update(video);
            this.setState({ tags: video.tags })
            Analytics.events.VIDEO_TAG(tags.length);
        }

        const handleValueCreated = tag => {
            video.addTag(tag);
            new Persistence().update(video);
            this.setState({ tags: video.tags })
        }

        return (
            <SuggestiveInput
                values={tags}
                onChange={handleChange}
                onValueCreated={handleValueCreated}
            />
        );
    }

    renderFileInfo() {
        const { videoPath } = this.state;
        const { video } = this.props;
        return (
            <div className="file-info">
                <FileExistenceIndicator path={videoPath} />
                {
                    video.deleted ?
                        <Tooltip content='This file is marked as deleted' position={Position.RIGHT}>
                            <Icon iconName="pt-icon-trash" className='file-status-icon' style={{ color: '#A82A2A' }} />
                        </Tooltip>
                        : null
                }
                {this.renderBreadCrumb()}
            </div>
        )
    }

    renderBreadCrumb() {
        const { video } = this.props;
        const breadcrumbs = [];
        if (video) {
            const separator = process.platform === "win32" ? '\\' : '/';
            const crumbs = video.path.split(separator)
            let incrementalPath = '';
            for (let i = 0; i < crumbs.length - 1; i++) {
                incrementalPath += crumbs[i] + separator;
                let currentPath = incrementalPath;
                breadcrumbs.push(<li key={'crumb' + i}><a className="pt-breadcrumb" onClick={() => this.handleExploreFolder(currentPath)}>{crumbs[i]}</a></li>)
            }
        }
        return (
            <ul className="pt-breadcrumbs">
                {/* <li><a className="pt-breadcrumbs-collapsed" href="#"></a></li>
                <li><a className="pt-breadcrumb pt-disabled">Folder one</a></li>
                <li><a className="pt-breadcrumb" href="#">Folder two</a></li>
                <li><a className="pt-breadcrumb" href="#">Folder three</a></li>
                <li><span className="pt-breadcrumb pt-breadcrumb-current">File</span></li> */}
                {breadcrumbs}
            </ul>
        )
    }

    private handleMakeScreenshots = (e: React.MouseEvent<HTMLDivElement>) => {
        ToastHelper.info('Making screenshots...')
        console.log('VideoDetails: sending', IpcEvents.Background.ScreenshotsOneVideo, this.props.video)
        ipcRenderer.send(IpcEvents.Background.ScreenshotsOneVideo, this.props.video);
    }

    private handleOpenContainingFolder = (e: React.MouseEvent<HTMLDivElement>) => {
        ipcRenderer.send(IpcEvents.Video.OpenContainingFolder, this.props.video.path)
    }

    private handleExploreFolder = (path) => {
        ipcRenderer.send(IpcEvents.Video.Explorer, path)
    }

    private renderDeletedOverlay() {
        return (
            // visual='pt-icon-cross'
            <div className='deleted-overlay' style={{ display: 'none' }}>
                <NonIdealState
                    visual='pt-icon-trash'
                    title='This video is removed'
                />
            </div>
        )
    }

    render() {
        const { video, people, nextVideoId, previousVideoId } = this.props;
        const { isModalAttachPeopleOpen, videoPath, isModalRenameOpen } = this.state;
        if (video) {
            const favClass = video.isFavorite ? ' is-fav' : '';
            const screenshotElements = !video.screenshots ? null : video.screenshots.map(this.renderThumbnail);
            const peopleElements = !people ? null : people.map(this.renderPerson);
            return (
                <div id="video-details">
                    <div className="navigation">
                        <Button className='previous pt-small' iconName='arrow-left' disabled={!previousVideoId} onClick={this.previous}>Previous</Button>
                        <Tooltip content={video.path} position={Position.BOTTOM_LEFT} className='truncate'>
                            <span className='title' onClick={this.handleOpenContainingFolder}>{video.getName(true)}</span>
                        </Tooltip>
                        <Button className='next pt-small' rightIconName='arrow-right' disabled={!nextVideoId} onClick={this.next}>Next</Button>
                    </div>
                    {video.deleted ? this.renderDeletedOverlay() : null}
                    {videoPath ? this.renderFileInfo() : null}
                    <div className='buttons'>
                        <Icon className='play video-action' iconName='pt-icon-play' onClick={this.play} />
                        {/* <Icon className={'fav video-action' + favClass} iconName='pt-icon-heart' onClick={ this.markFavorite }/> */}
                        <Popover
                            interactionKind={PopoverInteractionKind.CLICK}
                            popoverClassName="pt-popover-content-sizing"
                            position={Position.BOTTOM_RIGHT}
                            content={this.renderPopoverContent()}>
                            <Icon className='more video-action' iconName='pt-icon-more' />
                        </Popover>
                    </div>
                    <div className="video-info">
                        <div className="metadata">
                            <b>Duration: </b><span>{video.length}</span><br />
                            <b>Resolution: </b><span>{`${video.width}x${video.height}`}</span><br />
                            <b>Size: </b><span>{filesize(video.size)}</span><br />
                        </div>
                        <div className="tags">
                            {this.renderTags()}
                        </div>
                    </div>

                    <div className='people'>
                        {peopleElements}
                        <div><Icon iconName='pt-icon-new-person' className='btn-circle-add' onClick={this.openAttachPersonModal} /></div>
                    </div>
                    <div className='screenshots'>
                        {screenshotElements}
                    </div>

                    <AttachPeopleModal
                        people={people}
                        isOpen={isModalAttachPeopleOpen}
                        onClose={() => this.setState({ isModalAttachPeopleOpen: false })}
                        onSaved={this.handleSavePeople}
                    />
                    <ConfirmAlert
                        isOpen={this.state.isDeleteConfirmationOpen}
                        text="Are you sure? This video will be removed from your library."
                        confirmButtonText='Move to recycle bin'
                        handleCancel={() => this.setState({ isDeleteConfirmationOpen: false })}
                        data={this.state.deleteConfirmationData}
                        handleConfirm={this.handleRecycleConfirmed}
                    />
                    <RenameModal
                        video={video}
                        isOpen={isModalRenameOpen}
                        onClose={() => this.setState({ isModalRenameOpen: false })}
                        onRenamed={(renamed) => { this.props.replaceVideos([renamed]) }}
                    />
                </div>
            );
        }
        else {
            return null;
        }
    }
}

function mapStateToProps(state, ownProps): IVideoDetailsReduxProps {
    return {
        video: state.myReducer.currentVideo,
        people: state.myReducer.currentPeople,
        nextVideoId: state.myReducer.nextVideoId,
        previousVideoId: state.myReducer.previousVideoId,
    }
}

function mapDispatchToProps(dispatch): IVideoDetailsReduxActions {
    return {
        load: videoId => dispatch(myActions.loadVideoDetails(videoId)),
        saveAttachedPeople: (video, newPeople) => dispatch(myActions.saveAttachedPeople(video, newPeople)),
        replaceVideos: videos => dispatch(myActions.replaceVideos(videos)),
        markFavorite: (video, isFavorite) => dispatch(myActions.markFavorite(video, isFavorite)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(VideoDetails);