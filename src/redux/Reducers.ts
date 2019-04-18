import { ReduxActions } from '../common/Constants'
import * as _ from 'lodash'
import IState from '../types/IState'
import IAction from '../types/IAction'
import VideoStore from '../store/VideoStore'
import PersonStore from '../store/PersonStore'
import Router from '../core/Router'
import Search from '../types/Search'

export function myReducer(state:IState = {}, action:IAction):IState {
    switch(action.type) {
        case ReduxActions.SEARCH:
        {
            let searchResults: Search;
            let searchHistory = state.searchHistory;

            if (action.search) {
                searchResults = new Search();
                searchResults.request = action.search.replace(/[\W]/g,' ').replace(/_+/g,' ').trim().toLocaleLowerCase();
                const matchedPeople = state.people ? state.people.filter(p => p.match(searchResults.request)) : [];
                searchResults.videos = state.allVideos && searchResults.request ? state.allVideos.filter((v) => v.match(searchResults.request, matchedPeople)) : state.allVideos;
                searchResults.allVideos = [...searchResults.videos]
                searchResults.people = new PersonStore(state.people).getPeopleByVideos(searchResults.videos);
                searchHistory = [searchResults, ...state.searchHistory || []]
                Router.to.SearchResults(searchResults.id);
            }
            else {
                Router.to.Home();
            }
            return {
                ...state,
                searchResults: searchResults,
                searchHistory: searchHistory
            };
        }
        case ReduxActions.SEARCH_FILTER_CHANGED:
        {
            return {
                ...state,
                searchResults: _.cloneDeep(action.searchResults.applyFilters())
            }   
        }
        case ReduxActions.LOAD_VIDEOS_LIST_SUCCESS:
            const store = new VideoStore(action.videos);
            const ordered = store.orderByDefault();
            const bookmarks = store.getBookmarked();
            return {
                ...state,
                videos: ordered,
                allVideos: ordered,
                bookmarks
            }
        case ReduxActions.LOAD_PERSON_DETAILS_SUCCES:
            const videos = new VideoStore(state.allVideos).getAllByPersonId(action.personId)
            const personStore = new PersonStore(state.people);
            return {
                ...state,
                videos,
                person: personStore.getById(action.personId),
                otherPeople: personStore.getPeopleByVideos(videos, [action.personId])
            }
        case ReduxActions.LOAD_PEOPLE_SUCCESS:
        {
            let currentPeople;
            if (state.currentVideo) {
                currentPeople = new PersonStore(action.people).getPeopleByIds(state.currentVideo.people);
            }
            return {
                ...state,
                people: new PersonStore(action.people).orderByName(),
                currentPeople: currentPeople
            }
        }
        case ReduxActions.CREATE_PERSON:
        {
            const people = state.people || [];
            return {
                ...state,
                people: [PersonStore.prepareUi(action.person), ...people],
            }
        }
        case ReduxActions.DELETE_PERSON:
        {
            const people = [...state.people];
            return {
                ...state,
                people: _.remove(people, p => p._id !== action.person._id),
            }
        }
        case ReduxActions.LOAD_VIDEO_DETAILS_SUCCES:
            const video = new VideoStore(state.allVideos).getById(action.videoId);
            const people = new PersonStore(state.people).getPeopleByIds(video.people);
            const currentVideos = state.searchResults ? state.searchResults.videos : state.videos;
            const currentIndex = currentVideos.indexOf(video);
            return {
                ...state,
                currentVideo: video,
                currentPeople: [...people],
                nextVideoId: (currentIndex + 1 < currentVideos.length) ? currentVideos[currentIndex + 1]._id : undefined,
                previousVideoId: (currentIndex - 1 >= 0) ? currentVideos[currentIndex - 1]._id : undefined
            }
        case ReduxActions.SAVE_ATTACHED_PEOPLE_SUCCESS:
        // bof, i should use CREATE_PERSON to add the created people to the state
            return {
                ...state,
                people: new PersonStore(state.people).addPeople(action.newPeople),
                currentVideo: action.video,
                currentPeople: action.newPeople
            }
        case ReduxActions.REPLACE_VIDEOS: {
            const videostore = new VideoStore(state.allVideos).replace(action.videos);
            const video = state.currentVideo ? videostore.getById(state.currentVideo._id) : undefined;
            const people = video ? new PersonStore(state.people).getPeopleByIds(video.people) : undefined;
            return {
                ...state,
                videos: videostore.orderByDefault(),
                allVideos: videostore.orderByDefault(),
                currentVideo: video,
                currentPeople: people
            }
        }
        case ReduxActions.MARK_FAVORITE_SUCCESS: {
            const bookmarks = state.bookmarks || [];
            if (action.video.isFavorite) {
                bookmarks.splice(0, 0, action.video)
            }
            else {
                bookmarks.splice(_.findIndex(bookmarks, { '_id': action.video._id }), 1)
            }
            return {
                ...state,
                videos: state.allVideos,
                currentVideo: VideoStore.prepareUi(action.video), // pass through VideoStore to have a new instance and force a render
                bookmarks: [...bookmarks]
            }
        }
        case ReduxActions.OPEN_EDIT_PERSON_MODAL: {
            return {
                ...state,
                isModelEditPersonOpen: true,
                editablePerson: action.person
            }
        }
        case ReduxActions.CLOSE_EDIT_PERSON_MODAL: {
            return {
                ...state,
                isModelEditPersonOpen: false,
                editablePerson: null
            }
        }
        case ReduxActions.INJECT_VIDEOS:
        {
            console.log('ReduxActions.INJECT_VIDEOS', action.videos.length)
            console.log(action.videos)
            const ordered = new VideoStore([...action.videos, ...state.allVideos]).orderByDefault();
            return {
                ...state,
                videos: ordered,
                allVideos: ordered
            }
        }
        case ReduxActions.ROUTE_CHANGED:
            return {
                ...state,
                currentVideo: Router.is.Home() ? null: state.currentVideo,
                videos: Router.is.Home() ? state.allVideos : state.videos
            }
        case ReduxActions.SAVE_RULE:
        {
            const rules = state.rules || [];
            rules.splice(0, 0, action.rule);
            return {
                ...state,
                rules: rules
            }
        }
        case ReduxActions.LOAD_RULES:
        {
            return {
                ...state,
                rules: action.rules
            }
        }
        default:
            return state;
    }
}
