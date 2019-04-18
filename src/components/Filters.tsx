import * as React from "react"
import { connect } from 'react-redux'
import Video from "../types/Video";
import * as _ from 'lodash'
import { Button, Intent, Tab2, Tabs2, Tag } from '@blueprintjs/core';
import IState from "../types/IState";
import Person from "../types/Person";
import PersonStore from "../store/PersonStore";
import PersonCircle from "./PersonCircle";
import Search from "../types/Search";

interface IFiltersReduxActions {
}

interface IFiltersReduxProps {
    people: Person[]
}

interface IFiltersProps extends IFiltersReduxProps, IFiltersReduxActions {
    currentVideos: Video[]
    search: Search
    onChanged: () => void
}

interface IFiltersState {
    activeTab: string
    selectedTags: string[]
    selectedPeople: string[]
}

class Filters extends React.Component<IFiltersProps, IFiltersState> {

    constructor() {
        super();
        this.state = {
            activeTab: '',
            selectedTags: [],
            selectedPeople: []
        }
    }

    handleTagClicked = (tag:string) => {
        this.props.search.switchTag(tag)
        this.props.onChanged();
    }

    handlePersonClicked = (person:Person) => {
        this.props.search.switchPerson(person);
        this.props.onChanged();
    }

    renderFilterTags = () => {
        const tags = _.uniq(_.compact(_.flattenDeep(this.props.currentVideos.map(v => v.tags)))) as string[];
        const tagElements = _.orderBy(tags).map(tag => {
            const className = 'tag'
            const isTagSelected = this.props.search.selectedTags.indexOf(tag) >= 0;
            return <Tag key={tag} className={className + (isTagSelected ? ' selected' : '')} onClick={() => this.handleTagClicked(tag)}>{tag}</Tag>
        });

        return (
            <div>
                {tagElements}
            </div>
        )
    }

    renderFilterPeople = () => {
        const { search, currentVideos } = this.props;
        const people = new PersonStore(this.props.people).getPeopleByVideos(currentVideos);
        const peopleElements = people.map((person) => {
            let className = (search.selectedPeople.length > 0 && _.findIndex(search.selectedPeople, { '_id': person._id }) >= 0) ? '' : 'not-selected';
            return <PersonCircle className={className} key={person._id} person={person} onClick={ () => this.handlePersonClicked(person) } />
        });

        return (
            <div className='people'>
                {peopleElements}
            </div>
        )
    }

    render() {
        return (
            <Tabs2 id="tab-filters" className='filters' renderActiveTabPanelOnly={true} onChange={(newTabId: string, prevTabId: string) => this.setState({ activeTab: newTabId })}>
                <Tab2 id={'filter-tags'} title="Tags" panel={this.renderFilterTags()} />
                <Tab2 id={'filter-people'} title="People" panel={this.renderFilterPeople()} />
                <Tabs2.Expander />
            </Tabs2>
        )
    }

}


function mapStateToProps(state: { myReducer: IState }, ownProps): IFiltersReduxProps {
    return {
        people: state.myReducer.people,
    }
}

function mapDispatchToProps(dispatch): IFiltersReduxActions {
    return {
        // load: videoId => dispatch(myActions.loadVideoDetails(videoId)),
        // saveAttachedPeople: (video, newPeople) => dispatch(myActions.saveAttachedPeople(video, newPeople)),
        // replaceVideos: videos => dispatch(myActions.replaceVideos(videos)),
        // markFavorite: (video, isFavorite) => dispatch(myActions.markFavorite(video, isFavorite)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Filters);