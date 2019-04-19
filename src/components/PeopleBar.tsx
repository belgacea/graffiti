import * as React from "react";
import { connect } from 'react-redux'
import { ipcRenderer } from 'electron';
import * as _ from 'lodash'
import { Icon } from '@blueprintjs/core';
import * as ReactList from 'react-list';

import * as myActions from '../redux/Actions'
import { KeyCodes } from '../common/Constants'
import PersonCircle from './PersonCircle';
import Person from '../types/Person';
import Router from '../core/Router';
import ConfirmAlert from '../modal/ConfirmAlert';

import { IpcEvents } from '../common/Constants';
import * as Analytics from '../common/Analytics';

interface IPeopleBarReduxActions {
    load?: Function
}

interface IPeopleBarProps extends IPeopleBarReduxActions {
    people: Person[]
    openCreatePersonModal: () => void
}

interface IPeopleBarState {
    isExpanded: boolean
    search: string
    people: Person[]
    deleteConfirmationIsOpen: boolean
    deleteConfirmationConfirmButtonText?: string
    deleteConfirmationData?: Person
}

class PeopleBar extends React.Component<IPeopleBarProps, IPeopleBarState> {
    private peopleElements: any;

    constructor(props: IPeopleBarProps) {
        super(props);
        this.state = {
            isExpanded: false,
            search: '',
            people: props.people || [],
            deleteConfirmationIsOpen: false
        };
    }

    componentWillReceiveProps(nextProps: IPeopleBarProps) {
        this.setState({
            people: this.filterPeople(nextProps.people, this.state.search)
        });
    }

    filterPeople(people: Person[], search: string): Person[] {
        search = search.replace(/[\W]/g,' ').replace(/_+/g,' ').trim().toLowerCase()
        if (!people || people.length === 0) {
            return [];
        }

        if (search) {
            people = _.filter(people, person => {
                const tags = (person.tags || []).toString();
                return person.name.concat(tags).toLowerCase().indexOf(search) >= 0;
            });
        }

        Analytics.events.PEOPLE_SEARCH(search);
        
        return people;
    }

    expandCollapse = () => {
        this.setState({ isExpanded: !this.state.isExpanded })
    }

    onClear = () => {
        this.setState({ search: '', people: this.props.people })
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            search: event.currentTarget.value,
            people: this.filterPeople(this.props.people, event.currentTarget.value.trim())
        })
    }

    handleClick = (person: Person) => {
        Router.to.PersonDetails(person._id);
        this.props.load(person._id)
    }

    handleDelete = (person: Person) => {
        this.setState({
            deleteConfirmationIsOpen: true,
            deleteConfirmationData: person
        });
    }

    handleDeleteConfirmed = (person: Person) => {
        this.setState({
            deleteConfirmationIsOpen: false,
            deleteConfirmationData: null
        });
        ipcRenderer.send(IpcEvents.Background.DeletePerson, person);
    }

    renderPerson = (person: Person) => {
        return (
            <div className='person' key={person._id} onClick={() => this.handleClick(person)}>
                <PersonCircle person={person} hideTooltip={this.state.isExpanded} disableClick={true} onDeleteClicked={this.handleDelete} />
                <span className='person-name'>{person.name}</span>
            </div>
        )
    }

    onLetterClicked = (letter:string) => {
        const index = _.findIndex(this.state.people, p => p.name.substring(0,1).toLocaleUpperCase() === letter);
        this.peopleElements.scrollTo(index);
    }

    render() {
        const { people, isExpanded } = this.state;
        const expandCollapseIconName = isExpanded ? 'double-chevron-left' : 'double-chevron-right';
        const confirmButtonText = this.state.deleteConfirmationData ? 'Delete "' + this.state.deleteConfirmationData.name + '"' : '';
        const alphabet = [...'abcdefghijklmnopqrstuvwxyz'.toUpperCase()].map(letter => 
            <span className='letter' key={'letter' + letter} onClick={ () => this.onLetterClicked(letter) }>{letter}</span>
        );

        return (
            <div id="people-bar" className={isExpanded ? 'expanded' : ''}>
                <div className="people-bar-actions">
                    <div className='top-buttons'>
                        <Icon icon={expandCollapseIconName} className='expand-collapse' onClick={this.expandCollapse} />
                    </div>
                    <Icon icon='plus' className='btn-circle-add' onClick={this.props.openCreatePersonModal} />
                    <div className='search-area pt-dark'>
                        <input id='search-people' className="pt-input" type="text" dir="auto" placeholder="Filter"
                            onChange={this.handleChange}
                            value={this.state.search} />
                        <button className="pt-button pt-minimal cross" onClick={this.onClear}></button>
                        <span className="people-count">Total: {this.state.people.length}</span>
                    </div>
                </div>
                <div className="alphabet">
                    {alphabet}
                </div>
                <div className="people">
                    <ReactList
                        ref={ ref => { this.peopleElements = ref } }
                        itemRenderer={(index, key) => { return this.renderPerson(people[index]) }}
                        length={people.length}
                        type='uniform'
                    />
                </div>
                <ConfirmAlert
                    isOpen={this.state.deleteConfirmationIsOpen}
                    text="Are you sure? This person will be removed from all videos."
                    confirmButtonText={confirmButtonText}
                    handleCancel={() => this.setState({ deleteConfirmationIsOpen: false })}
                    data={this.state.deleteConfirmationData}
                    handleConfirm={this.handleDeleteConfirmed}
                />
            </div>
        );
    }
}

function mapDispatchToProps(dispatch): IPeopleBarReduxActions {
    return {
        load: personId => dispatch(myActions.loadPersonDetails(personId))
    }
}

export default connect(undefined, mapDispatchToProps)(PeopleBar);
