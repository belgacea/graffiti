import * as React from "react";
// import * as Dropzone from 'react-dropzone'
import { Dialog, Button, Intent, Checkbox } from "@blueprintjs/core";
import Persistence from '../core/Persistence';
import Person from '../types/Person';
import * as Path from 'path'
import * as fs from 'fs-extra'
import PersonStore from '../store/PersonStore'
import ToastHelper from "../core/ToastHelper";

interface ICreatePersonModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (person: Person) => void
  people: Person[]
}

interface ICreatePersonModalState {
  personName?: string
  photo?: string
  shouldMatchVideos?: boolean
}

export default class CreatePersonModal extends React.Component<ICreatePersonModalProps, ICreatePersonModalState> {

  constructor() {
    super();
    this.state = {
      shouldMatchVideos: true
    }
  }

  handleChange = (event: any) => {
    this.setState({ personName: event.target.value });
  }

  save = async () => {
    let personName = this.state.personName.trim();
    if (!personName) { // empty string
      return;
    }
    const existingPerson = new PersonStore(this.props.people).getByName(personName);
    if (existingPerson) {
      ToastHelper.error('"' + personName + '" already exists');
      return;
    }

    const uuidv1 = require('uuid/v1');
    console.warn('TODO: use Util.uuid')
    const db = new Persistence();

    const settings = await db.getSettings();
    const originalPhoto = this.state.photo;
    let photo;
    if (originalPhoto) {
      photo = Path.join(settings.PictureFolder, uuidv1().replace(/-/g, '') + Path.extname(this.state.photo));
      fs.copySync(this.state.photo, photo);
    }

    let person = new Person(personName, photo, this.state.shouldMatchVideos);
    db.insert(person).then((personSaved: Person) => {
      this.props.onSaved(personSaved);
      this.setState({ personName: null, photo: null });
    });
  }

  onDrop(acceptedFiles, rejectedFiles) {
    this.setState({ photo: acceptedFiles[0].path })
  }

  render() {
    return (
      <Dialog
        iconName="person"
        isOpen={this.props.isOpen}
        onClose={this.props.onClose}
        title="New">
        <div className="pt-dialog-body" id='create-person'>
          {/* <Dropzone onDrop={this.onDrop.bind(this)} className='drop-image-person'> */}
            {/* {this.state.photo ? <img src={this.state.photo} className='dropped-image' /> : null} */}
          {/* </Dropzone> */}
          <div className="right">
            <input className="pt-input person-name" type="text" placeholder="Person's name" dir="auto" onChange={this.handleChange} />
            <br />
            <br />
            <Checkbox
              checked={this.state.shouldMatchVideos}
              onChange={() => { this.setState({ shouldMatchVideos: !this.state.shouldMatchVideos }) }}
              label='Automatically match to videos' />
          </div>
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              text="Cancel"
              onClick={this.props.onClose}
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