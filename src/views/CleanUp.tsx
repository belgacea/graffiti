import * as React from "react"
import * as _ from 'lodash'
import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import * as filesize from 'filesize';
import * as ReactList from 'react-list';
import * as Util from '../common/Util'
import { IpcEvents } from '../common/Constants.js'
import { ProgressBar, Switch, Button, Intent, Tab, Tabs } from '@blueprintjs/core';
import Video from "../types/Video";
import Persistence from "../core/Persistence";
import VideoStore from "../store/VideoStore";
import ConfirmAlert from '../modal/ConfirmAlert'
import ToastHelper from '../core/ToastHelper'
import { SelectableVideo, CleanUpResult } from "../types/MaintenanceTypes";
import SelectableVideoItem from '../components/SelectableVideoItem'
import * as Analytics from '../common/Analytics';

const TAB_ID_EXISTING_VIDEOS = 'clean-up-result-existing';
const TAB_ID_NON_EXISTING_VIDEOS = 'clean-up-result-non-existing';

interface ICleanUpReduxProps {
}

interface ICleanUpProps extends ICleanUpReduxProps {
}

interface ICleanUpState {
    started: boolean
    result?: CleanUpResult
    confirmationIsOpen?: boolean
    progress: number
    activeTab?: string
    handleConfirmed?: (data) => void
    data?: SelectableVideo[]
}

export default class CleanUp extends React.Component<ICleanUpProps, ICleanUpState> {
    static previousState: ICleanUpState;

    constructor(props: ICleanUpProps) {
        super(props);

        if (CleanUp.previousState) {
            this.state = CleanUp.previousState;
        }
        else {
            this.state = {
                started: false,
                progress: 0,
            };
        }

        ipcRenderer.on(IpcEvents.Background.CleanUp.Result, (event, result: CleanUpResult) => {
            console.log('IpcEvents.Background.CleanUp.Result', result)
            const allVideoIds = _.concat(result.existingVideosDeletedIds, result.nonExistingVideoNotDeletedIds)
            new Persistence().getByIds(allVideoIds).then((videos: Video[]) => {
                _.each(result.existingVideosDeletedIds, id => {
                    const video = _.find(videos, v => v._id === id)
                    result.existingVideosDeleted.push(Object.assign(new SelectableVideo(), VideoStore.prepareUi(video)));
                });
                _.each(result.nonExistingVideoNotDeletedIds, id => {
                    const video = _.find(videos, v => v._id === id)
                    result.nonExistingVideoNotDeleted.push(Object.assign(new SelectableVideo(), VideoStore.prepareUi(video)));
                });

                this.setState({
                    result,
                    started: false
                });
            })
        });

        ipcRenderer.on(IpcEvents.Background.CleanUp.Progress, (event, progress) => {
            this.setState({ progress });
        })
    }

    onStart = () => {
        this.setState({ started: true })
        ipcRenderer.send(IpcEvents.Background.CleanUp.Start);
    }

    onDelete = () => {
        this.setState({ confirmationIsOpen: true });
    }

    getSelectedVideos(tabId: string): SelectableVideo[] {
        const { activeTab, result } = this.state;
        switch (tabId) {
            case TAB_ID_EXISTING_VIDEOS:
                return _.filter(result.existingVideosDeleted, v => v.isSelected)
            case TAB_ID_NON_EXISTING_VIDEOS:
                return _.filter(result.nonExistingVideoNotDeleted, v => v.isSelected)
            default:
                return [];
        }
    }

    // private getPotentialSizeCleared(): number {
    //     let size = 0;

    //     _.each(this.state.duplicateGroups, group => {
    //         _.times(group.videos.length - 1, n => {
    //             size += group.videos[n].size;
    //         });
    //     })

    //     return size;
    // }

    componentWillUnmount() {
        CleanUp.previousState = this.state;
    }

    // onDuplicateVideoSelected = (duplicateGroup: DuplicateGroup, duplicateVideo: DuplicateVideo, isSelected: boolean) => {
    //     _.find(duplicateGroup.videos, d => d._id === duplicateVideo._id).isSelected = isSelected;

    //     const size = filesize(_.sum(this.getSelectedVideos().map(v => v.size)));

    //     this.setState({
    //         size
    //     });
    // }

    restore = (videos: SelectableVideo[]) => {
        this.setState({ confirmationIsOpen: false, handleConfirmed: undefined, data: undefined });
        _.each(videos, video => {
            new Persistence().setFields(video._id, { deleted: undefined })
        })
        ToastHelper.success('Restored', 'cleanup');
        Analytics.events.CLEAN_UP_RESTORE(videos.length);
    }

    markDeleted = (videos: SelectableVideo[]) => {
        this.setState({ confirmationIsOpen: false, handleConfirmed: undefined, data: undefined });
        _.each(videos, video => {
            new Persistence().setFields(video._id, { deleted: true })
        })
        ToastHelper.success('Marked as deleted', 'cleanup');
        Analytics.events.CLEAN_UP_DELETE(videos.length);
    }

    moveToBin = (videos: SelectableVideo[]) => {
        this.setState({ confirmationIsOpen: false, handleConfirmed: undefined, data: undefined });
        const promises = []
        _.each(videos, video => {
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
        })
        Promise.all(promises)
        .then(() => {
            ToastHelper.success('Deleting completed', 'cleanup');
        });
        Analytics.events.CLEAN_UP_MOVE_TO_BIN(videos.length);
    }

    renderResults(result: CleanUpResult) {
        const renderItem = (selectableVideo: SelectableVideo) => {
            return <SelectableVideoItem key={'cleanup' + selectableVideo._id} selectableVideo={selectableVideo} onSelected={(selectableVideo, isSelected) => { this.setState({})}} />
        }

        const selectedExistingVideosDeleted = this.getSelectedVideos(TAB_ID_EXISTING_VIDEOS);
        const existingVideosDeletedElements = (
            <div>
                <div>
                    <Button text="Restore selected" disabled={selectedExistingVideosDeleted.length === 0} intent={Intent.PRIMARY} onClick={() => this.setState({ confirmationIsOpen: true, data: selectedExistingVideosDeleted, handleConfirmed: this.restore })} />
                    <Button text="Move to bin" disabled={selectedExistingVideosDeleted.length === 0} intent={Intent.DANGER} onClick={() => this.setState({ confirmationIsOpen: true, data: selectedExistingVideosDeleted, handleConfirmed: this.moveToBin })} />
                </div>
                <b>Existing videos marked as deleted: {result.existingVideosDeletedIds.length}</b>
                {
                    <ReactList
                        itemRenderer={(index, key) => { return renderItem(result.existingVideosDeleted[index]) }}
                        length={result.existingVideosDeletedIds.length}
                        type='uniform'
                    />
                }
            </div>
        );

        const selectedNonExistingVideoNotDeleted = this.getSelectedVideos(TAB_ID_NON_EXISTING_VIDEOS);
        const nonExistingVideoNotDeletedElements = (
            <div>
                <div>
                    <Button text="Mark as deleted" disabled={selectedNonExistingVideoNotDeleted.length === 0} intent={Intent.WARNING} onClick={() => this.setState({ confirmationIsOpen: true, data: selectedNonExistingVideoNotDeleted, handleConfirmed: this.markDeleted })} />
                    <Button text="Move to bin" disabled={selectedNonExistingVideoNotDeleted.length === 0} intent={Intent.DANGER} onClick={() => this.setState({ confirmationIsOpen: true, data: selectedNonExistingVideoNotDeleted, handleConfirmed: this.moveToBin })} />
                </div>
                <b>Videos not found in your folders but still in your library: {result.nonExistingVideoNotDeletedIds.length}</b>
                {
                    <ReactList
                        itemRenderer={(index, key) => { return renderItem(result.nonExistingVideoNotDeleted[index]) }}
                        length={result.nonExistingVideoNotDeletedIds.length}
                        type='uniform'
                    />
                }
            </div>
        );

        return (
            <Tabs id="clean-up-result" renderActiveTabPanelOnly={true} onChange={(newTabId: string, prevTabId: string) => this.setState({ activeTab: newTabId })}>
                <Tab id={TAB_ID_EXISTING_VIDEOS} title="Deleted videos still on the hard drive" panel={existingVideosDeletedElements} />
                <Tab id={TAB_ID_NON_EXISTING_VIDEOS} title="Unfound videos from hard drive" panel={nonExistingVideoNotDeletedElements} />
                <Tabs.Expander />
            </Tabs>
        )
    }

    render() {
        const { started, confirmationIsOpen, result, activeTab, handleConfirmed, data, } = this.state;
        const progress = this.state.progress === 0 ? 0 : this.state.progress / 100;
        // const potentialSize = this.getPotentialSizeCleared();

        return (
            <div id='duplicates'>
                <button type="button" disabled={started} className="pt-button pt-intent-success" onClick={this.onStart}>
                    Start
                </button>

                {/* <span>Potential size to free: {filesize(potentialSize)}</span>
                <br /> */}

                <br /><br /><br />

                {
                    started ? 
                        <div>
                            Searching ... ({this.state.progress}%)
                            <br />
                            <ProgressBar value={progress} />
                        </div>
                        : null
                }

                {
                    result ?
                        this.renderResults(result)
                        : null
                }

                <ConfirmAlert
                    isOpen={confirmationIsOpen}
                    handleCancel={() => this.setState({ confirmationIsOpen: false, handleConfirmed: undefined, data: undefined })}
                    data={data}
                    handleConfirm={handleConfirmed}
                />
            </div>
        );
    }
}
