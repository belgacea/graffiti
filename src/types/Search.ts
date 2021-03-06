import * as uuidv1 from 'uuid/v1'
import * as _ from 'lodash'
import Person from "./Person";
import Video from "./Video";

export default class Search {
    public id: string;
    public request: string;
    public allVideos: Video[]
    public videos: Video[];
    public people: Person[];
    public selectedTags: string[]
    public selectedPeople: Person[]

    public constructor() {
        this.id = uuidv1();
        this.selectedTags = []
        this.selectedPeople = [];
    }

    public toString() {
        return this.request;
    }

    public switchTag(tag: string) {
        const index = this.selectedTags.indexOf(tag);
        if (index >= 0) {
            this.selectedTags.splice(index, 1)
        }
        else {
            this.selectedTags.push(tag)
        }
    }

    public switchPerson(person: Person) {
        const index = _.findIndex(this.selectedPeople, { '_id': person._id })
        if (index >= 0) {
            this.selectedPeople.splice(index, 1)
        }
        else {
            this.selectedPeople.push(person)
        }
    }

    public applyFilters() {
        this.videos = _.filter(this.allVideos, (video: Video) => {
            return _.intersection(video.tags, this.selectedTags).length >= this.selectedTags.length
                && _.intersection(video.people, this.selectedPeople.map(p => p._id)).length >= this.selectedPeople.length
        })
        return this;
    }
}