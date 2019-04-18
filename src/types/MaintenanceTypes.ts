import Video from "./Video";

export class DuplicateGroup {
    public hash: string;
    public videoIds: Array<string>;
    public videos: Array<SelectableVideo>

    public constructor(hash: string) {
        this.hash = hash;
        this.videoIds = [];
        this.videos = [];
    }
}

export class SelectableVideo extends Video {
    public isSelected: boolean;

    public constructor() {
        super('')
        this.isSelected = false;
    }
}

export class CleanUpResult {
    public nonExistingVideoNotDeletedIds: Array<string>;
    public existingVideosDeletedIds: Array<string>;
    public nonExistingVideoNotDeleted: Array<SelectableVideo>
    public existingVideosDeleted: Array<SelectableVideo>

    public constructor() {
        this.nonExistingVideoNotDeletedIds = [];
        this.existingVideosDeletedIds = [];
        this.nonExistingVideoNotDeleted = [];
        this.existingVideosDeleted = [];
    }
}
