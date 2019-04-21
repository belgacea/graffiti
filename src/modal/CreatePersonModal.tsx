import * as React from "react";
import Dropzone from 'react-dropzone'
import { Dialog, Button, Intent, Checkbox } from "@blueprintjs/core";
import Persistence from '../core/Persistence';
import Person from '../types/Person';
import * as Path from 'path'
import * as fs from 'fs-extra'
import PersonStore from '../store/PersonStore'
import ToastHelper from "../core/ToastHelper";
const uuidv1 = require('uuid/v1');

interface ICreatePersonModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (person: Person) => void
  people: Person[]
}

interface ICreatePersonModalState {
  personName?: string
  shouldMatchVideos?: boolean
  photoBase64?: any
  filename?: string
}

export default class CreatePersonModal extends React.Component<ICreatePersonModalProps, ICreatePersonModalState> {

  constructor(props: any) {
    super(props);
    this.state = {
      shouldMatchVideos: true
    }
  }

  handleChange = (event: any) => {
    this.setState({ personName: event.target.value });
  }

  save = async () => {
    let photo;
    const db = new Persistence();
    const settings = await db.getSettings();
    let personName = (this.state.personName || '').trim();

    if (!personName) { // empty string
      ToastHelper.error('The name is required');
      return;
    }

    const existingPerson = new PersonStore(this.props.people).getByName(personName);
    if (existingPerson) {
      ToastHelper.error('"' + personName + '" already exists');
      return;
    }

    if (!fs.existsSync(settings.PictureFolder)) {
      fs.mkdirSync(settings.PictureFolder)
    }

    if (this.state.photoBase64) {
      photo = Path.join(settings.PictureFolder, uuidv1().replace(/-/g, '') + Path.extname(this.state.filename))
      fs.writeFileSync(photo, this.state.photoBase64.replace(/^data:image\/png;base64,/, ''), 'base64')
    }

    let person = new Person(personName, photo, this.state.shouldMatchVideos);
    db.insert(person).then((personSaved: Person) => {
      this.props.onSaved(personSaved);
      this.setState({ personName: null });
    });
  }

  onDrop(acceptedFiles: File[]) {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = () => {
      this.setState({ photoBase64: reader.result, filename: file.path })
    }

    reader.readAsDataURL(file)
  }

  render() {
    const src = this.state.photoBase64
    return (
      <Dialog
        icon="person"
        isOpen={this.props.isOpen}
        onClose={this.props.onClose}
        title="New">
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