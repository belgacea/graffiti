import * as React from "react"
import * as _ from 'lodash'
import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import * as filesize from 'filesize';
import * as ReactList from 'react-list';
import * as Util from '../common/Util'
import { IpcEvents } from '../common/Constants.js'
import { ProgressBar } from '@blueprintjs/core';
import Video from "../types/Video";
import Persistence from "../core/Persistence";
import VideoStore from "../store/VideoStore";
import ConfirmAlert from '../modal/ConfirmAlert'
import ToastHelper from '../core/ToastHelper'
import { DuplicateGroup, SelectableVideo } from "../types/MaintenanceTypes";
import DuplicateGroupItem from '../components/DuplicateGroupItem'
import * as Analytics from '../common/Analytics';

interface IDuplicatesReduxProps {
}

interface IDuplicatesProps extends IDuplicatesReduxProps {
}

interface IDuplicatesState {
    started: boolean
    duplicateGroups?: DuplicateGroup[]
    deleteConfirmationIsOpen?: boolean
    size: number
    progress: number
}

export default class Duplicates extends React.Component<IDuplicatesProps, IDuplicatesState> {
    static previousState: IDuplicatesState;

    constructor(props: IDuplicatesProps) {
        super(props);

        if (Duplicates.previousState) {
            this.state = Duplicates.previousState;
        }
        else {
            this.state = {
                started: false,
                size: 0,
                progress: 0
            };
        }

        ipcRenderer.on(IpcEvents.Background.Duplicates.Result, (event, duplicateGroups: Array<DuplicateGroup>) => {
            // console.log('Duplicates result:', duplicateGroups.length);
            // console.log(duplicateGroups)
            const allVideoIds = _.flatten(duplicateGroups.map((dup, index) => dup.videoIds))
            // console.log('allVideoIds.length', allVideoIds.length)
            new Persistence().getByIds(allVideoIds).then((videos: Video[]) => {
                const store = new VideoStore(videos);
                // console.log('got', videos.length, 'videos')
                _.each(duplicateGroups, group => {
                    _.each(group.videoIds, id => {
                        group.videos.push(Object.assign(new SelectableVideo(), VideoStore.prepareUi(store.getById(id))));
                    })
                })

                this.setState({ duplicateGroups, started: false });
            });
        });

        ipcRenderer.on(IpcEvents.Background.Duplicates.Progress, (event, progress) => {
            this.setState({ progress });
        })
    }

    onStart = () => {
        this.setState({ started: true, duplicateGroups: null })
        ipcRenderer.send(IpcEvents.Background.Duplicates.Start);
    }

    onDelete = () => {
        this.setState({ deleteConfirmationIsOpen: true });
    }

    private getSelectedVideos(): SelectableVideo[] {
        let duplicateGroups = this.state.duplicateGroups || [];
        return _.filter(_.flatten(duplicateGroups.map(g => g.videos)), d => d.isSelected);
    }

    private getPotentialSizeCleared(): number {
        let size = 0;

        _.each(this.state.duplicateGroups, group => {
            _.times(group.videos.length - 1, n => {
                size += group.videos[n].size;
            });
        })

        return size;
    }

    handleDeleteConfirmed = () => {
        ToastHelper.info('Deleting...', 'duplicates');
        this.setState({ deleteConfirmationIsOpen: false });
        const promises = []
        _.each(this.getSelectedVideos(), video => {
            promises.push(
                new Persistence().setFields(video._id, { deleted: true })
                    .then(() => {
                        video.deleted = true;

                        Util.recycleFile(video.path)
                            .then(() => {
                                video.isSelected = false;
                            })
                            .catch(() => {
                                ToastHelper.error('Could not remove:' + video.path)
                            });
                    })
            );
        });

        Promise.all(promises)
            .then(() => {
                ToastHelper.success('Deleting completed', 'duplicates');
                const { duplicateGroups } = this.state;

                // remove deleted videos from the list
                _.each(duplicateGroups, group => {
                    const newVideos = [...group.videos];
                    _.each(group.videos, duplicateVideo => {
                        if (duplicateVideo.isSelected) {
                            _.remove(newVideos, duplicateVideo)
                        }
                    });
                    group.videos = newVideos;
                });
                this.setState({ duplicateGroups: [...duplicateGroups] });
            });
        Analytics.events.DUPLICATES_DELETE(promises.length);
    }

    componentWillUnmount() {
        Duplicates.previousState = this.state;
    }

    onDuplicateVideoSelected = (duplicateGroup: DuplicateGroup, duplicateVideo: SelectableVideo, isSelected: boolean) => {
        _.find(duplicateGroup.videos, d => d._id === duplicateVideo._id).isSelected = isSelected;

        const size = filesize(_.sum(this.getSelectedVideos().map(v => v.size)));

        this.setState({
            size
        });
    }

    renderItem = (index, key) => {
        const { duplicateGroups } = this.state;

        if (duplicateGroups.length === 0)
            return null;

        return <DuplicateGroupItem key={'renderItem' + key} duplicateGroup={duplicateGroups[index]} onItemSelected={this.onDuplicateVideoSelected} />;
    }

    renderProgress() {
        const progress = this.state.progress === 0 ? 0 : this.state.progress / 100;
        return (
            <div>
                Searching for duplicates... ({this.state.progress}%)
                <br />
                <ProgressBar value={progress} />
            </div>
        );
    }

    render() {
        const { started, duplicateGroups, size } = this.state;
        const selectedVideos = this.getSelectedVideos();
        const potentialSize = this.getPotentialSizeCleared();

        return (
            <div id='duplicates'>
                <button type="button" disabled={started} className="pt-button pt-intent-success" onClick={this.onStart}>
                    Start
                </button>

                <button type="button" disabled={selectedVideos.length === 0} className="pt-button pt-intent-danger" onClick={this.onDelete}>
                    Deleted selected
                </button>

                <span>Total selected : {size} ({selectedVideos.length} videos)</span>
                <br />
                <span>Groups: {duplicateGroups ? duplicateGroups.length : 0}</span>  <span>Potential size to free: {filesize(potentialSize)}</span>
                <br />

                <br /><br /><br /><br />

                {
                    started ? this.renderProgress() : null
                }

                {
                    duplicateGroups ?
                        duplicateGroups.length > 0 ?
                        <ReactList
                            itemRenderer={this.renderItem}
                            length={duplicateGroups.length}
                            type='variable'
                        />
                        : <b>No duplicates</b>
                    : null
                }

                <ConfirmAlert
                    isOpen={this.state.deleteConfirmationIsOpen}
                    text="Do you really want to move the selected files to the recycle bin?"
                    confirmButtonText='Yes'
                    handleCancel={() => this.setState({ deleteConfirmationIsOpen: false })}
                    handleConfirm={this.handleDeleteConfirmed}
                />
            </div>
        );
    }
}
