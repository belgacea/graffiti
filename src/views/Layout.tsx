import * as React from 'react';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import * as myActions from '../redux/Actions'

import PeopleBar from '../components/PeopleBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CreatePersonModal from '../modal/CreatePersonModal';
import EditPersonModal from '../modal/EditPersonModal';
import Person from "../types/Person";
import FirstStart from "./FirstStart";
import Persistence from '../core/Persistence'
import ToastHelper from '../core/ToastHelper'

import { IpcEvents } from '../common/Constants.js'

interface ILayoutProps {
    people?: Person[]
    createPerson?: Function
    loadVideos?: Function
}

interface ILayoutState {
    isFirstStart: boolean
    isModalCreatePersonOpen: boolean
    isModalEditPersonOpen: boolean
}

class Layout extends React.Component<ILayoutProps, ILayoutState> {
    
    constructor(props) {
        super(props);
        
        this.state = {
            isFirstStart: undefined,
            isModalCreatePersonOpen: false,
            isModalEditPersonOpen: false
        }

        ipcRenderer.on(IpcEvents.Startup.IsFirstStart, (event: any, isFirstStart:boolean) => {
            this.setState({isFirstStart: isFirstStart});
        });
        ipcRenderer.send(IpcEvents.Startup.IsFirstStart); // TODO use sync
    }

    onFirstStartFinished = () => {
        this.props.loadVideos();
        this.setState({isFirstStart: false});
    }

    onPersonSaved = (person:Person) => {
        this.props.createPerson(person)
        this.setState({ isModalCreatePersonOpen: false });
        if (person.autoMatch) {
            ipcRenderer.send(IpcEvents.Background.MatchPerson, person);
        }
        else {
            ToastHelper.info('Auto-match disabled for ' + person.name);
        }
    }

    render()  {
        const { people } = this.props;
        switch(this.state.isFirstStart) {
            case undefined:
            case null:
                return <div>loading</div>
            case true: 
                return <FirstStart onFinished={ this.onFirstStartFinished } />
            case false:
                return (
                    <div>
                        <Header />
                        <PeopleBar
                            people={ people }
                            openCreatePersonModal={ () => this.setState({isModalCreatePersonOpen: true}) } />
                        <main>
                            { this.props.children }
                        </main>
                        <Footer />
                        <CreatePersonModal
                            isOpen={ this.state.isModalCreatePersonOpen }
                            onClose={ () => this.setState({isModalCreatePersonOpen: false}) }
                            onSaved={ this.onPersonSaved }
                            people={ people }
                        />
                        <EditPersonModal />
                    </div>
                );
        }
    }
}

function mapStateToProps(state, ownProps):ILayoutProps {
    return {
        people: state.myReducer.people,
    }
}

function mapDispatchToProps(dispatch):ILayoutProps {
    return {
        createPerson: person => dispatch(myActions.createPerson(person)),
        loadVideos: () => dispatch(myActions.loadVideos())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Layout);

// I connected Layout to get the videos, but apparently I don't need to do this, I already have them