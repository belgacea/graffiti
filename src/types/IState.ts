import Video from './Video';
import Person from './Person';
import Search from './Search';

export default interface IState {
    search?: string
    videos?: Video[]
    searchResults?: Search
    allVideos?: Video[]
    people?:Person[]
    person?:Person
    otherPeople?:Person[]
    currentVideo?:Video
    currentPeople?:Person[]
    nextVideoId?:string
    previousVideoId?:string
    isModelEditPersonOpen?:boolean
    editablePerson?:Person
}