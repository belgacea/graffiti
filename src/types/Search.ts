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
    
    public constructor() {
            this.id = uuidv1();
            this.selectedTags = []
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

        console.log(this.selectedTags)
    }

    public applyFilters() {
        if (this.selectedTags.length > 0) {
            this.videos = _.filter(this.allVideos, (video:Video) => _.intersection(video.tags, this.selectedTags).length >= this.selectedTags.length)
        }
        else {
            this.videos = this.allVideos
        }
        
        return this;
    }
}