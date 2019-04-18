import Video from './Video';
import Person from './Person';
import Rule from './Rule';
import Search from './Search';

export default interface IAction {
    type:string
    search?:string
    videos?:Video[]
    personId?:string
    videoId?:string
    people?:Person[]
    person?:Person
    video?:Video
    newPeople?:Person[]
    rule?: Rule
    rules?: Rule[]
    searchResults?: Search
}