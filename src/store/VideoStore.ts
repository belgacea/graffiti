import * as _ from 'lodash'
import Persistence from '../core/Persistence'
import Video from '../types/Video'
import Person from '../types/Person'

export default class VideoStore {

    private videos:Video[];
    
    public constructor(videos:Video[]) {
        this.videos = videos || [];
    }

    public getAllByPersonId(personId:string) {
        return _.filter(this.videos, video => _.includes(video.people, personId));
    }

    public getById(videoId:string) {
        return _.find(this.videos, v => v._id === videoId);
    }

    public orderByDefault() {
        // return _.orderBy(this.videos, ['fileModificationTime'], ['desc']);
        return _.orderBy(this.videos, ['fileCreationTime'], ['desc']);
    }

    public replace(videos:Video[]) {
        const allExceptReceived = _.remove(this.videos, video => !_.includes(videos.map(v => v._id), video._id));
        this.videos = [
            ...allExceptReceived,
            ...videos
        ];
        return this;
    }

    /* STATIC */

    /**
     * Prepare the video to be consumed by the UI.
     * @param video 
     */
    public static prepareUi(v:any):Video {
        // instantiate new Video
        const video = new Video();
        // copy properties to new instance
        _.merge(video, v);
        // Object.assign(new Video(), v); // same ?

        return video;
    }

    public static async updatePeople(video: Video, people:Person[]): Promise<number> {
        const db = new Persistence();
        video.people = people.map(p => p._id);
        console.warn('TODO: use Database.setFields')
        return db.update(video)
    }
}