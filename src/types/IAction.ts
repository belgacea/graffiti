import Video from './Video';
import Person from './Person';
import Rule from './Rule';

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
}