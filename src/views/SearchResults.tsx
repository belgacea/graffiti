import * as React from 'react';
import * as _ from 'lodash';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';

import VideoGrid from '../components/VideoGrid';

import Video from '../types/Video';
import PersonCircle from '../components/PersonCircle';
import Search from '../types/Search';
import Person from '../types/Person';

interface ISearchResultsProps {
    searchResults?: Search,
}

interface ISearchResultsState {
}

class SearchResults extends React.Component<ISearchResultsProps, ISearchResultsState> {
    public static scrollY:number = 0;
    
    constructor() {
        super();
    }

    renderPerson = (person: Person, index: number) => {
        return <PersonCircle key={person._id} person={person} />;
    }

    render() {
        const {searchResults} = this.props;
        const videos = searchResults ? searchResults.videos : [];
        const peopleElements = searchResults && searchResults.people ? searchResults.people.map(this.renderPerson) : null;

        return (
            <div id="search-results">
                <div className='people'>
                        {peopleElements}
                    </div>
                <h3>Search: {searchResults.request}</h3>
                <div id="video-list">
                    <VideoGrid videos={ videos } />
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        searchResults: state.myReducer.searchResults
    }
}

export default connect(mapStateToProps)(SearchResults)