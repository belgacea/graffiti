import * as _ from 'lodash'
import * as Analytics from '../common/Analytics';
import { ReduxActions } from '../common/Constants'
import VideoStore from '../store/VideoStore'
import PersonStore from '../store/PersonStore'
import Persistence from '../core/Persistence'
import Video from '../types/Video'
import Person from '../types/Person'
import Rule from '../types/Rule';
import Search from '../types/Search';

export function search(search) {
    Analytics.events.VIDEO_SEARCH(search);
    return {
        type: ReduxActions.SEARCH,
        search
    }
}

function loadVideosSuccess(videos) {
    Analytics.events.STARTUP_LOAD_VIDEO(videos.length);
    return {
        type: ReduxActions.LOAD_VIDEOS_LIST_SUCCESS,
        videos
    }
}

export function loadVideos() : any {
    console.warn('Actions.loadVideos start')
    console.time('loadVideos')
    return function(dispatch) {
        return new Persistence()
            .getAll(Video.TYPE)
            .then(videos => {
                console.log('Actions.loadVideos end', videos.length)
                console.timeEnd('loadVideos')
                let all = videos.map(VideoStore.prepareUi);
                return Promise.all(all);
            })
            .then(videos => { 
                dispatch(loadVideosSuccess(videos))
            })
            .catch(err => { throw err })
    }
}

export function loadPersonDetails(personId:string) {
    return {
        type: ReduxActions.LOAD_PERSON_DETAILS_SUCCES,
        personId
    }
}

function loadPeopleSuccess(people) {
    Analytics.events.STARTUP_LOAD_PEOPLE(people.length);
    return {
        type: ReduxActions.LOAD_PEOPLE_SUCCESS,
        people
    }
}

export function loadPeople() : any {
    return function(dispatch) {
        return new Persistence()
            .getAll(Person.TYPE)
            .then(people => { 
                people = people.map(PersonStore.prepareUi)
                dispatch(loadPeopleSuccess(people))
            })
            .catch(err => { throw err })
    }
}

export function createPerson(person: Person) {
    Analytics.events.PEOPLE_ADD(person.name);
    return {
        type: ReduxActions.CREATE_PERSON,
        person
    }
}

export function deletePerson(person: Person) {
    Analytics.events.PEOPLE_REMOVE(person.name);
    return {
        type: ReduxActions.DELETE_PERSON,
        person
    }
}

export function loadVideoDetails(videoId:string) {
    return {
        type: ReduxActions.LOAD_VIDEO_DETAILS_SUCCES,
        videoId
    }
}

function saveAttachedPeopleSuccess(video:Video, newPeople:Person[]) {
    Analytics.events.VIDEO_ATTACH_PERSON();
    return {
        type: ReduxActions.SAVE_ATTACHED_PEOPLE_SUCCESS,
        video,
        newPeople
    }
}

export function saveAttachedPeople(video:Video, newPeople:Person[]) {
    return function(dispatch) {
        return VideoStore.updatePeople(video, newPeople)
        .then(() => {
                dispatch(saveAttachedPeopleSuccess(video, newPeople))
            })
            .catch(err => { throw err })
    }
}

export function replaceVideos(videos:Video[]) { // looks a lot like injectVideos
    console.log('Action.replaceVideos', videos)
    console.warn('TODO: not good: videos does not have the proper date format(to test?). remove this and use replaceInjectVideos')
        if (!videos || videos.length === 0) {
            return nothing();
        }
        return { 
            type: ReduxActions.REPLACE_VIDEOS,
            videos: videos.map(VideoStore.prepareUi)
        };
}

export function markFavoriteSuccess(video:Video) {
    return {
        type: ReduxActions.MARK_FAVORITE_SUCCESS,
        video
    }
}

export function markFavorite(video:Video, isFavorite:boolean) {
    return function(dispatch) {
        video.isFavorite = isFavorite;
        return new Persistence()
            .update(video)
            .then(() => { 
                dispatch(markFavoriteSuccess(video))
            })
            .catch(err => { throw err })
    }
}

export function openEditPersonModal(person:Person) {
    return {
        type: ReduxActions.OPEN_EDIT_PERSON_MODAL,
        person
    }
}

export function closeEditPersonModal() {
    return {
        type: ReduxActions.CLOSE_EDIT_PERSON_MODAL
    }
}

export function injectVideos(videos:Video[]) : any {
    console.log('Action.injectVideos', videos.length)
    console.warn('rename to REPLACE_INJECT_VIDEOS -- will remove existent and inject new from db, param should be ids')
    return function(dispatch) {
        if (!videos || videos.length === 0) {
            return dispatch(nothing());
        }
        return new Persistence()
            .getByIds(videos.map(v => v._id))
            .then((videos) => {
                dispatch({ 
                    type: ReduxActions.INJECT_VIDEOS,
                    videos: videos.map(VideoStore.prepareUi)
                });
            })
            .catch(err => { throw err })
    }
}

function nothing() {
    return { type: '' }
}

export function routeChanged(routeName:string) {
    return {
        type: ReduxActions.ROUTE_CHANGED,
        routeName
    }
}

export function saveRule(rule: Rule) {
    return function(dispatch) {
        return new Persistence()
            .insert(rule)
            .then(() => {
                dispatch({ 
                    type: ReduxActions.SAVE_RULE,
                    rule
                });
            })
            .catch(err => { throw err })
    }
}

export function loadRules() : any {
    return function(dispatch) {
        return new Persistence()
            .getAll(Rule.TYPE)
            .then((rules) => {
                dispatch({
                    type: ReduxActions.LOAD_RULES,
                    rules: _.orderBy(rules, ['createdAt'], ['desc'])
                })
            })
    }
}

export function searchFilterChanged(searchResults: Search) {
    return {
        type: ReduxActions.SEARCH_FILTER_CHANGED,
        searchResults
    }
}