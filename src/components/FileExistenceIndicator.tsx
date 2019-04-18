import * as React from 'react';
import * as fs from 'fs';
import { Icon, Tooltip, Position } from '@blueprintjs/core';

interface IFileExistenceIndicatorProps {
    path: string
}

interface IFileExistenceIndicatorState {
    path?: string
    fileExists?: boolean
}

export default class FileExistenceIndicator extends React.Component<IFileExistenceIndicatorProps, IFileExistenceIndicatorState> {

    constructor(props: IFileExistenceIndicatorProps) {
        super(props);
        this.state = {
            path: props.path
        }
    }

    refresh = () => {
        this.setState({fileExists: undefined})
        const { path } = this.state;
        if (!path) return;
        //console.warn('fs.exists is deprecated') // https://stackoverflow.com/questions/4482686/check-synchronously-if-file-directory-exists-in-node-js
        //https://nodejs.org/api/fs.html#fs_fs_exists_path_callback
        fs.exists(path, e => {
            // if (!this.willUnmount) {
            this.setState({
                fileExists: e
            });
            // console.log(path, e)
            // }
        })
    }

    componentWillReceiveProps(nextProps: IFileExistenceIndicatorProps) {
        this.setState({
            path: nextProps.path
        })
        this.refresh();
    }

    componentDidMount() {
        this.refresh();
    }

    render() {
        let icon, tooltip = null;
        switch (this.state.fileExists) {
            case true:
                icon = <Icon iconName="pt-icon-tick-circle" className='file-status-icon' style={{ color: '#0A6640' }} onClick={this.refresh} />
                tooltip = 'The file exists'
                break;
            case false:
                icon = <Icon iconName="pt-icon-error" className='file-status-icon' style={{ color: '#A82A2A' }} onClick={this.refresh} />
                tooltip = 'The file was not found'
                break;
            default:
                icon = <Icon iconName="pt-icon-help" className='file-status-icon' style={{ color: '#0E5A8A' }} onClick={this.refresh} />
                tooltip = 'Existence unknown'
                break;
        }

        return (
            <Tooltip content={tooltip} position={Position.RIGHT}>
                {icon}
            </Tooltip>
        )
    }
}