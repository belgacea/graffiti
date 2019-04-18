export default class Folder {
    public static readonly TYPE: string = 'folder';

    private type: string;
    public readonly _id: string;

    public path: string;
    public autoRefresh: boolean;

    public constructor(path: string, autoRefresh: boolean = true) {
        // this.type = Folder.TYPE;
        this.path = path;
        this.autoRefresh = autoRefresh;
    }
}