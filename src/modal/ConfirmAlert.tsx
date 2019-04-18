import * as React from "react";

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

    render() {
        const { handleCancel, text, isOpen, confirmButtonText } = this.props;
        return (
            <Alert
                confirmButtonText={confirmButtonText || 'Confirm'}
                cancelButtonText="Cancel"
                iconName="trash"
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