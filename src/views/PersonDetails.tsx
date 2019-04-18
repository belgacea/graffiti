import * as React from "react";
import { connect } from 'react-redux'
import * as myActions from '../redux/Actions'
import { Tag, Intent } from '@blueprintjs/core'

import Persistence from '../core/Persistence';
import PersonCircle from '../components/PersonCircle'
import VideoGrid from '../components/VideoGrid'
import Person from '../types/Person'
import Video from '../types/Video'

interface IPersonDetailsProps extends IPersonDetailsReduxProps {
    personId: string
}

interface IPersonDetailsReduxProps {
    videos?: Video[]
    person?: Person
    load?: (personId: string) => void
    otherPeople?: Person[]
}

interface IPersonDetailsState {
}

class PersonDetails extends React.Component<IPersonDetailsProps, IPersonDetailsState> {

    constructor(props: IPersonDetailsProps) {
        super(props);
    }

    async componentDidMount() {
        this.props.load(this.props.personId);
    }

    render() {
        const { person, videos, otherPeople } = this.props;
        const name = person ? person.name : '';
        const otherPeopleElements = (otherPeople || []).map(p => <PersonCircle key={p._id} person={p} size='small' />);
        const tagElements = person ? (person.tags || []).map(tag => <Tag>{tag}</Tag>) : null;
        return (
            <div id='person-details'>
                <div className='person-info'>
                    <PersonCircle person={person} hideTooltip={true} />
                    <span className='name'>{name}</span>
                    <hr style={{ width: '100%', margin: '0' }} />
                    <div className="tags">
                        {tagElements}
                    </div>
                    <div className="other-people">
                        {otherPeopleElements}
                    </div>
                </div>
                <div className='videos'>
                    <VideoGrid videos={videos} />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps): IPersonDetailsReduxProps {
    return {
        ...ownProps,
        videos: state.myReducer.videos,
        person: state.myReducer.person,
        otherPeople: state.myReducer.otherPeople,
    }
}

function mapDispatchToProps(dispatch): IPersonDetailsReduxProps {
    return {
        load: personId => dispatch(myActions.loadPersonDetails(personId))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PersonDetails);