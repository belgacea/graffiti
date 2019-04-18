import * as React from "react";
import { connect } from 'react-redux'
import { Icon, Tooltip, Position } from '@blueprintjs/core'
import { ContextMenuTarget, Menu, MenuItem } from '@blueprintjs/core'

import * as myActions from '../redux/Actions'
import Router from '../core/Router'
import Person from '../types/Person';

interface IPersonCircleReduxActions {
    load?: Function
    openEditPersonModal?: Function
}

interface IPersonCircleProps extends IPersonCircleReduxActions {
    person?:Person
    onClick?: (person:Person) => void
    disableClick?:boolean
    hideTooltip?:boolean
    onDeleteClicked?:(person:Person) => void
    size?:string
    className?: string
}

@ContextMenuTarget
class PersonCircle extends React.Component<IPersonCircleProps, undefined> {

    onClick() {
        if (this.props.disableClick) {
            return;
        }
        if (this.props.onClick) {
            this.props.onClick(this.props.person)
        }
        else {
            Router.to.PersonDetails(this.props.person._id);
            this.props.load(this.props.person._id)
        }
    }

    handleEdit = () => {
        this.props.openEditPersonModal(this.props.person);
    }

    handleDelete = () => {
        this.props.onDeleteClicked(this.props.person);
    }

    renderContextMenu() {
        // return a single element, or nothing to use default browser behavior
        const deleteMenuItem = this.props.onDeleteClicked ? <MenuItem onClick={this.handleDelete} text="Delete" /> : null;
        return (
            <Menu>
                <MenuItem onClick={this.handleEdit} text="Edit" />
                { deleteMenuItem }
            </Menu>
        );
    }


    render() {
        let { person, hideTooltip, size, className } = this.props;
        size = size || '';
        className = className || '';
        if (person) {
            const tooltip = hideTooltip ? '' : person.name;
            return (
                <div className={'person-circle ' + size + ' ' + className} onClick={ this.onClick.bind(this) }>
                    <Tooltip content={ tooltip } position={Position.RIGHT}>
                    {
                        person.photo ?
                        <img src={ person.photo }/>
                        :
                        <Icon iconName='pt-icon-person' className='icon-no-photo' />
                    }
                    </Tooltip>
                </div>
            );
        }
        else {
            return this.renderEmpty()
        }
    }

    renderEmpty() {
        return (
            <div className='person-circle' onClick={ this.onClick.bind(this) }>
                <Icon iconName='pt-icon-person' className='icon-no-photo' />
            </div>
        );
    }
}

function mapDispatchToProps(dispatch):IPersonCircleReduxActions {
    return {
        load: personId => dispatch(myActions.loadPersonDetails(personId)),
        openEditPersonModal: person => dispatch(myActions.openEditPersonModal(person))
    }
}

export default connect(undefined, mapDispatchToProps)(PersonCircle);
