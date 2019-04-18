import * as React from "react";
import * as _ from 'lodash'
import { ipcRenderer } from 'electron';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { connect } from 'react-redux'
import { IpcEvents } from '../common/Constants.js'

import Persistence from '../core/Persistence';
import Person from '../types/Person';
import SuggestiveInput from '../components/SuggestiveInput'
import PersonCircle from '../components/PersonCircle'

interface IAttachPeopleModalProps {
  people:Person[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newPeople:Person[]) => void;
  peopleSuggestion:Person[]
}

interface IAttachPeopleModalState {
  people:Person[]
}

class AttachPeopleModal extends React.Component<IAttachPeopleModalProps, IAttachPeopleModalState> {
  
  constructor(props:IAttachPeopleModalProps) {
    super(props);
    this.state = {
      people: [...props.people]
    };
  }

  componentWillReceiveProps(nextProps: IAttachPeopleModalProps) {
    this.setState({ people: [...nextProps.people] });
  }

  cancel = () => {
    this.setState({ people: [...this.props.people] });
    this.props.onClose();
  }
  
  save = () => {
    const { people } = this.state;
    const created = _.filter(people, (p) => !p._id);
    const existing = _.filter(people, (p) => !!p._id);
    
    // save newly created people into db
    const newPersonCreation = [];
    const db = new Persistence();
    _.each(created, (person) => {
      newPersonCreation.push(db.insert(person));
    });
    Promise.all(newPersonCreation).then((result:Person[]) => {
      const allPeople = existing.concat(result);
      this.props.onSaved(allPeople);
      _.each(result, p => {
        if (p.autoMatch)
          ipcRenderer.send(IpcEvents.Background.MatchPerson, p)
        }
      );
    })
  }

  render() {
    const people = this.state.people || []
    return (
        <Dialog
            iconName="edit"
            isOpen={this.props.isOpen}
            onClose={this.props.onClose}
            title="Add or remove people to this video">
          <div className="pt-dialog-body" id='attach-people'>
            <SuggestiveInput
                values={ this.state.people }
                suggestions={this.props.peopleSuggestion}
                onChange={ people => { this.setState({people})} }
                onValueCreated={ value => { const {people} = this.state; people.push(new Person(value, null)); this.setState({people})}}
                renderSuggestion={ (suggestion:Person) => <span><PersonCircle person={suggestion} hideTooltip={true} /><span className='name'>{suggestion.name}</span></span> }
                renderTag={(tag) => tag.name }
                disableNewValues={true}
                />
          </div>
          <div className="pt-dialog-footer">
              <div className="pt-dialog-footer-actions">
                  <Button 
                      text="Cancel"
                      onClick={ this.cancel }
                  />
                  <Button
                      text="Save"
                      intent={ Intent.PRIMARY }
                      onClick={ this.save }
                  />
              </div>
          </div>
        </Dialog>
    );
  }
}

function mapStateToProps(state, ownProps):IAttachPeopleModalProps {
    return {
        ...ownProps,
        peopleSuggestion: state.myReducer.people
    }
}
    
export default connect(mapStateToProps)(AttachPeopleModal);