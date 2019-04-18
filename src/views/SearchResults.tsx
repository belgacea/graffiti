import * as React from 'react';
import * as _ from 'lodash';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import * as myActions from '../redux/Actions'

import VideoGrid from '../components/VideoGrid';

import Video from '../types/Video';
import PersonCircle from '../components/PersonCircle';
import Search from '../types/Search';
import Person from '../types/Person';
import Filters from '../components/Filters';

interface ISearchResultReduxActions {
    searchFilterChanged: (searchResults: Search) => void
}

interface ISearchResultsProps extends ISearchResultReduxActions {
    searchResults?: Search,
}

interface ISearchResultsState {
}

class SearchResults extends React.Component<ISearchResultsProps, ISearchResultsState> {
    public static scrollY: number = 0;

    constructor(props: ISearchResultsProps) {
        super(props);
    }

    handleFilterChanged = () => {
        this.props.searchFilterChanged(this.props.searchResults)
    }

    renderPerson = (person: Person, index: number) => {
        return <PersonCircle key={person._id} person={person} />;
    }

    render() {
        const { searchResults } = this.props;
        const videos = searchResults ? searchResults.videos : [];
        const request = searchResults ? searchResults.request : '';
        const peopleElements = searchResults && searchResults.people ? searchResults.people.map(this.renderPerson) : null;

        return (
            <div id="search-results">
                <h4>Search: {request}</h4>
                {/* <div className='people'>
                    {peopleElements}
                </div> */}
                <Filters currentVideos={videos} search={searchResults} onChanged={this.handleFilterChanged}/>
                <div id="video-list">
                    <VideoGrid videos={videos} />
                </div>
            </div>
        );
    }
}


function mapDispatchToProps(dispatch): ISearchResultReduxActions {
    return {
        searchFilterChanged: searchResults => dispatch(myActions.searchFilterChanged(searchResults))
    }
}

const mapStateToProps = state => {
    return {
        searchResults: state.myReducer.searchResults
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchResults)