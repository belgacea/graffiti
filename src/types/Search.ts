import Person from "./Person";
import Video from "./Video";
import * as uuidv1 from 'uuid/v1'

export default class Search {
    public id: string;
    public request: string;
    public videos: Video[];
    public people: Person[];
    
    public constructor() {
            this.id = uuidv1();
    }

    public toString() {
        return this.request;
    }    
}