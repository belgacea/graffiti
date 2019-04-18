import * as React from "react";
import * as _ from 'lodash'
import { ipcRenderer } from 'electron';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { connect } from 'react-redux'
import { IpcEvents } from '../common/Constants.js'
import * as Util from '../common/Util'

import { KeyCodes } from '../common/Constants'
import Persistence from '../core/Persistence';
import Video from "../types/Video.js";
import ToastHelper from "../core/ToastHelper";

interface IRenameModalProps {
    video: Video
    isOpen: boolean;
    onClose: () => void;
    onRenamed: (video: Video) => void;
}

interface IRenameModalState {
    name: string
}

export default class RenameModal extends React.Component<IRenameModalProps, IRenameModalState> {

    constructor(props: IRenameModalProps) {
        super(props);
        this.state = {
            name: props.video.getName()
        };
    }

    componentWillReceiveProps(nextProps: IRenameModalProps) {
        this.setState({ name: nextProps.video.getName() });
    }

    handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.keyCode === KeyCodes.Enter) {
            this.rename();
        }
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ name: event.currentTarget.value })
    }

    cancel = () => {
        this.props.onClose();
    }

    rename = () => {
        const { video } = this.props;
        const { name } = this.state;
        Util.renameFile(video.path, name + video.getExtension())
            .then(() => {
                video.setName(name);
                new Persistence().update(video).then(() => {
                    console.log('rename persisted');
                    this.props.onRenamed(video);
                    this.props.onClose();
                })
                .catch(err => console.error('rename err', err))
                ToastHelper.success('Renamed');
            })
            .catch((err) => {
                console.error(err)
                ToastHelper.error('Error')
            });
    }

    render() {
        return (
            <Dialog
                className='rename-modal'
                iconName="edit"
                isOpen={this.props.isOpen}
                onClose={this.props.onClose}
                title="Rename">
                <div className="pt-dialog-body">
                    <input className="pt-input" type="text" autoFocus={true}
                        value={this.state.name}
                        onKeyUp={this.handleKeyUp}
                        onChange={this.handleChange} />
                    <span>{this.props.video.getExtension()}</span>
                </div>
                <div className="pt-dialog-footer">
                    <div className="pt-dialog-footer-actions">
                        <Button
                            text="Cancel"
                            onClick={this.cancel}
                        />
                        <Button
                            text="Rename"
                            intent={Intent.PRIMARY}
                            onClick={this.rename}
                        />
                    </div>
                </div>
            </Dialog>
        );
    }
}

// function mapStateToProps(state, ownProps): IRenameModalProps {
//     return {
//         ...ownProps,
//     }
// }

// export default connect(mapStateToProps)(RenameModal);