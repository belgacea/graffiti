import * as React from "react";
// import * as Dropzone from 'react-dropzone'
import { Dialog, Button, Intent, Icon, Checkbox } from "@blueprintjs/core";
import Persistence from '../core/Persistence';
import Person from '../types/Person';
import * as Path from 'path'
import * as uuidv1 from 'uuid/v1'
import * as fs from 'fs-extra'
import { ipcRenderer } from 'electron';
import { IpcEvents } from '../common/Constants.js'

import { connect } from 'react-redux'
import * as myActions from '../redux/Actions'
import ToastHelper from "../core/ToastHelper";
import SuggestiveInput from "../components/SuggestiveInput";
import * as Analytics from '../common/Analytics';

interface IEditPersonModalReduxProps {
    isOpen: boolean
    person: Person
}

interface IEditPersonModalReduxActions {
    closeEditPersonModal?: () => void
    loadPeople?: () => void
}

interface IEditPersonModalProps extends IEditPersonModalReduxProps, IEditPersonModalReduxActions {
}

interface IEditPersonModalState {
    name: string
    photo: string
    shouldMatchVideos: boolean
    tags: string[]
}

class EditPersonModal extends React.Component<IEditPersonModalProps, IEditPersonModalState> {

    constructor() {
        super();
        this.state = {
            name: '',
            photo: null,
            shouldMatchVideos: undefined,
            tags: []
        }
    }

    componentWillReceiveProps(nextProps: IEditPersonModalProps) {
        const { person } = nextProps;
        this.setState({
            name: person ? person.name : '',
            photo: person ? person.photo : null,
            shouldMatchVideos: person ? person.autoMatch : undefined,
            tags: person && person.tags ? person.tags : []
        });
    }

    handleChange = (event: any) => {
        this.setState({ name: event.target.value });
    }

    save = async () => {
        const db = new Persistence();
        const settings = await db.getSettings();
        const { person } = this.props;
        let { name, photo, shouldMatchVideos, tags } = this.state;

        if (photo && photo !== person.photo) {
            console.warn('TODO: use Util.uuid')
            const newPhoto = Path.join(settings.PictureFolder, uuidv1().replace(/-/g, '') + Path.extname(photo));
            fs.copySync(photo, newPhoto);
            photo = newPhoto;
            console.warn('TODO: overwrite if exist ?')
        }

        if (!person.autoMatch && shouldMatchVideos) {
            ipcRenderer.send(IpcEvents.Background.MatchPerson, person);
        }

        if (person.name !== name) Analytics.events.PEOPLE_EDIT(person.name + ' > ' + name);
        if (person.tags !== tags) Analytics.events.PEOPLE_TAG(tags.toString());
        
        person.name = name;
        person.photo = photo;
        person.autoMatch = shouldMatchVideos;
        person.tags = tags;
        db.update(person).then(() => {
            this.props.closeEditPersonModal();
            this.props.loadPeople();
            ToastHelper.success('Changes saved');
            console.warn("TODO: this.props.editPerson ? utiliser loadPeople m'oblige à updater currentPeople aussi")
        });
    }

    onDrop = (acceptedFiles, rejectedFiles) => {
        this.setState({ photo: acceptedFiles[0].path })
    }

    handleDeletePhoto = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.stopPropagation();
        console.log(event)
        this.setState({ photo: null })
    }

    onTagChanged = (tags: string[]) => {
        this.setState({ tags })
    }

    onTagCreated = (value: string) => {
        const { tags } = this.state;
        tags.push(value);
        this.setState({ tags });
    }

    render() {
        const { isOpen } = this.props;
        const { name, photo } = this.state;
        return (
            <Dialog
                iconName="person"
                isOpen={isOpen}
                onClose={this.props.closeEditPersonModal}
                title="Edit">
                <div className="pt-dialog-body" id='create-person'>
                    {/* <Dropzone onDrop={this.onDrop} className='drop-image-person'> */}
                        {/* { photo ? <Icon iconName='pt-icon-delete' className='delete-photo' onClick={ this.handleDeletePhoto }/> : null } */}
                        {/* {photo ? <img src={photo} className='dropped-image' /> : null} */}
                    {/* </Dropzone> */}
                    <div className="right">
                        <input className="pt-input person-name" type="text" placeholder="Person's name" value={name} dir="auto" onChange={this.handleChange} />
                        <br />
                        <br />
                        <Checkbox
                            checked={this.state.shouldMatchVideos}
                            onChange={() => { this.setState({ shouldMatchVideos: !this.state.shouldMatchVideos }) }}
                            label='Automatically match to videos' />
                        <br />
                        <br />
                        <b>Tags</b>
                        <br />
                        <SuggestiveInput
                            values={this.state.tags}
                            onChange={this.onTagChanged}
                            onValueCreated={this.onTagCreated}
                        />
                    </div>
                </div>
                <div className="pt-dialog-footer">
                    <div className="pt-dialog-footer-actions">
                        <Button
                            text="Cancel"
                            onClick={this.props.closeEditPersonModal}
                        />
                        <Button
                            text="Save"
                            intent={Intent.PRIMARY}
                            onClick={this.save}
                        />
                    </div>
                </div>
            </Dialog>
        );
    }
}

function mapStateToProps(state, ownProps): IEditPersonModalReduxProps {
    return {
        isOpen: state.myReducer.isModelEditPersonOpen,
        person: state.myReducer.editablePerson
    }
}

function mapDispatchToProps(dispatch): IEditPersonModalReduxActions {
    return {
        // load: personId => dispatch(myActions.loadPersonDetails(personId)),
        // openEditPersonModal: person => dispatch(myActions.openEditPersonModal(person))
        closeEditPersonModal: () => dispatch(myActions.closeEditPersonModal()),
        loadPeople: () => dispatch(myActions.loadPeople())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPersonModal);
