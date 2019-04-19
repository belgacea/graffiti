import * as React from "react";
import * as Mousetrap from 'mousetrap'

import { Alert, Button, Intent, IToaster, Switch, Toaster } from "@blueprintjs/core";

interface IConfirmAlertProps {
    // intent?: Intent.PRIMARY
    isOpen: boolean
    handleCancel: () => void
    handleConfirm: (data?: any) => void
    data?: any
    text?: string
    confirmButtonText?: string
}

export default class ConfirmAlert extends React.Component<IConfirmAlertProps, undefined> {

    private handleConfirm = () => {
        this.props.handleConfirm(this.props.data);
    }

    componentDidMount() {
        Mousetrap.bind('escape', () => this.props.handleCancel());
    }

    componentWillUnmount() {
        Mousetrap.unbind('escape');
    }

    render() {
        const { handleCancel, text, isOpen, confirmButtonText } = this.props;
        return (
            <Alert
                confirmButtonText={confirmButtonText || 'Confirm'}
                cancelButtonText="Cancel"
                icon="trash"
                intent={Intent.DANGER}
                isOpen={isOpen}
                onCancel={handleCancel}
                onConfirm={this.handleConfirm}
            >
                <p>{text || 'Are you sure?'}</p>
            </Alert>
        );
    }
}