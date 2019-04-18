import Folder from "./Folder";

export default class AppSettings {
        public static readonly TYPE:string = 'app-settings';
        public static readonly LATEST_DATABASE_VERSION:number = 1;
        private type:string;
        private databaseVersion:number;
        public readonly _id:string;
        
        public WatchedFolders:Folder[];
        public ThumbnailFolder:string;
        public PictureFolder:string;
        public StartScreenshotOnStartup:boolean;
        public MakeScreenshotsOnDetails:boolean;
        public IsWatcherEnabled:boolean;
        // public CrawlOnStartup:boolean;
        public BackgroundParallelScreenshot:number;
        public ErrorLogPath: string;

        public constructor() {
                this.type = AppSettings.TYPE;
                this.StartScreenshotOnStartup = true;
                this.MakeScreenshotsOnDetails = false;
                this.IsWatcherEnabled = false;
                // this.CrawlOnStartup = true;
                this.BackgroundParallelScreenshot = 2;
        }


        public getDatabaseVersion() {
                return this.databaseVersion;
        }

        public setDatabaseVersion(version:number = AppSettings.LATEST_DATABASE_VERSION) {
                this.databaseVersion = version;
        }
}