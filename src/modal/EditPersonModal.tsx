import * as React from "react";
import { connect } from 'react-redux'
import Dropzone from 'react-dropzone'
import { Dialog, Button, Intent, Icon, Checkbox } from "@blueprintjs/core";
import Persistence from '../core/Persistence';
import Person from '../types/Person';
import * as Path from 'path'
import * as uuidv1 from 'uuid/v1'
import * as fs from 'fs-extra'
import { ipcRenderer } from 'electron';
import { IpcEvents } from '../common/Constants.js'

import * as myActions from '../redux/Actions'
import ToastHelper from "../core/ToastHelper";
import PersonStore from '../store/PersonStore'
import SuggestiveInput from "../components/SuggestiveInput";
import * as Analytics from '../common/Analytics';

interface IEditPersonModalReduxProps {
    isOpen: boolean
    person: Person
    people: Person[]
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
    photoBase64?: any
    filename?: string
}

const defaultState = {
    name: '',
    photo: null,
    shouldMatchVideos: undefined,
    tags: [],
    photoBase64: null,
    filename: null
}

class EditPersonModal extends React.Component<IEditPersonModalProps, IEditPersonModalState> {

    constructor(props: any) {
        super(props);
        this.state = {...defaultState}
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

    cancel = () => {
        this.setState({...defaultState})
        this.props.closeEditPersonModal()
    }

    save = async () => {
        const db = new Persistence();
        const settings = await db.getSettings();
        const { person } = this.props;
        const oldAutoMath = person.autoMatch;
        let { name, photo, shouldMatchVideos, tags } = this.state;

        if (!fs.existsSync(settings.PictureFolder)) {
            fs.mkdirSync(settings.PictureFolder)
        }

        if (this.state.photoBase64) {
            const oldPhoto = photo
            const filename = uuidv1().replace(/-/g, '') + Path.extname(this.state.filename)
            photo = Path.join(settings.PictureFolder, filename)
            fs.writeFileSync(photo, this.state.photoBase64.replace(/^data:image\/png;base64,/, ''), 'base64')
            try {
                if (oldPhoto) fs.unlinkSync(oldPhoto)
            }
            catch {}
        }

        if (person.name !== name) Analytics.events.PEOPLE_EDIT(person.name + ' > ' + name);
        if (person.tags !== tags) Analytics.events.PEOPLE_TAG(tags.toString());
        
        if (person.name !== name) {
            name = name.trim();
            if (!name) { // empty string
              ToastHelper.error('The name is required');
              return;
            }
            const existingPerson = new PersonStore(this.props.people).getByName(name);
            if (existingPerson) {
              ToastHelper.error('"' + name + '" already exists');
              return;
            }
        }

        person.name = name;
        person.photo = photo;
        person.autoMatch = shouldMatchVideos;
        person.tags = tags;
        db.update(person).then(() => {
            this.setState({...defaultState})
            this.props.closeEditPersonModal();
            this.props.loadPeople();
            ToastHelper.success('Changes saved');
            console.warn("TODO: this.props.editPerson ? using loadPeople makes updating currentPeople compulsory")
        });
        if (!oldAutoMath && shouldMatchVideos) {
            ipcRenderer.send(IpcEvents.Background.MatchPerson, person);
        }
    }

    onDrop(acceptedFiles: File[]) {
        const file = acceptedFiles[0]
        const reader = new FileReader()
    
        reader.onload = () => {
          this.setState({ photoBase64: reader.result, filename: file.path })
        }
    
        reader.readAsDataURL(file)
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
        const { isOpen } = this.props
        const { name, photoBase64, photo } = this.state
        const src = photoBase64 || photo
        return (
            <Dialog
                icon="person"
                isOpen={isOpen}
                onClose={this.props.closeEditPersonModal}
                title="Edit">
                <div className="pt-dialog-body" id='create-person'>
                    <Dropzone onDrop={this.onDrop.bind(this)}>
                        {({ getRootProps, getInputProps }) => (
                        <section>
                            <div {...getRootProps()} className='drop-image-person'>
                            <input {...getInputProps()} />
                            {src ? <img src={src} className='dropped-image' /> : null}
                            </div>
                        </section>
                        )}
                    </Dropzone>
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
                            onClick={this.cancel}
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
        person: state.myReducer.editablePerson,
        people: state.myReducer.people,
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
