import * as React from "react";
import { connect } from 'react-redux'
import * as myActions from '../redux/Actions'
import { Tag, Intent } from '@blueprintjs/core'

import Persistence from '../core/Persistence';
import PersonCircle from '../components/PersonCircle'
import VideoGrid from '../components/VideoGrid'
import Person from '../types/Person'
import Video from '../types/Video'
import Filters from "../components/Filters";
import Search from "../types/Search";

interface IPersonDetailsProps extends IPersonDetailsReduxProps {
    personId: string
}

interface IPersonDetailsReduxProps {
    // videos?: Video[]
    searchResults?: Search
    person?: Person
    load?: (personId: string) => void
    // otherPeople?: Person[]
}

interface IPersonDetailsState {
    videos: Video[]
}

class PersonDetails extends React.Component<IPersonDetailsProps, IPersonDetailsState> {

    constructor(props: IPersonDetailsProps) {
        super(props);
        this.state = {
            videos: props.searchResults ? props.searchResults.allVideos : []
        }
    }

    async componentDidMount() {
        this.props.load(this.props.personId);
    }

    componentWillReceiveProps(nextProps: IPersonDetailsProps) {
        this.setState({ videos: nextProps.searchResults ? nextProps.searchResults.allVideos : [] })
    }

    handleFilterChanged = () => {
        this.props.searchResults.applyFilters();
        this.setState({ videos: this.props.searchResults.videos })
    }

    render() {
        const { person, searchResults } = this.props;
        const { videos } = this.state
        
        if (!person) {
            return <div></div>
        }

        const name = person ? person.name : '';
        // const otherPeopleElements = ((searchResults ? searchResults.people : []) || []).map(p => <PersonCircle key={p._id} person={p} size='small' />);
        const tagElements = person ? (person.tags || []).map(tag => <Tag>{tag}</Tag>) : null;
        return (
            <div id='person-details'>
                <div className='person-info'>
                    <PersonCircle person={person} hideTooltip={true} className='person-bar-photo' />
                    <span className='name'>{name}</span>
                    <hr style={{ width: '100%', margin: '0' }} />
                    <div className="tags">
                        {tagElements}
                    </div>
                    {/* <div className="other-people">
                        {otherPeopleElements}
                    </div> */}
                </div>
                <Filters currentVideos={videos} search={searchResults} onChanged={this.handleFilterChanged} excludedPeople={[person]}/>
                <div className='videos'>
                    {/* <Filters currentVideos={videos} /> */}
                    <VideoGrid videos={videos} />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps): IPersonDetailsReduxProps {
    return {
        ...ownProps,
        searchResults: state.myReducer.searchResults,
        person: state.myReducer.person,
    }
}

function mapDispatchToProps(dispatch): IPersonDetailsReduxProps {
    return {
        load: personId => dispatch(myActions.loadPersonDetails(personId))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PersonDetails);