import * as _ from 'lodash';
import * as Path from 'path';
import Person from './Person';
import Screenshot from './Screenshot';

export default class Video {
        public static readonly TYPE: string = 'video';
        public static readonly INDEX_MAIN_SCREEN: number = 2;

        private type: string;
        public readonly _id: string;
        public path: string;
        public screenshots: Screenshot[];
        public people: string[];
        public tags: string[];
        public duration: number;
        public length: string;
        public width: number;
        public height: number;
        public size: number;
        public isFavorite: boolean;
        public notes: string;
        public screenshotsFolder: string;
        public screenshotPrefix: string;
        public hash: string;
        public fileCreationTime: Date;
        public fileModificationTime: Date;
        public deleted?: boolean

        public constructor(path?: string) {
                this.type = Video.TYPE;
                this.path = path;
        }

        public getName(keepExtension: boolean = false): string {
                if (keepExtension) {
                        return this.path.split('\\').pop().split('/').pop();
                }
                else {
                        return this.path.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, "");
                }
        }

        public getExtension() {
                const indexDot = this.path.lastIndexOf('.');
                return this.path.substr(indexDot, this.path.length - indexDot);
        }

        public setName(name: string) {
                const newPath = Path.join(Path.dirname(this.path), name + this.getExtension())
                this.path = newPath;
        }

        public getScreen(index: number): string {
                return this.screenshots[index] ? this.getScreenshotFullpath(this.screenshots[index].path) : undefined;
        }

        public getMainScreen(): string {
                // TODO remove function and use getScreen(index: number = Video.INDEX_MAIN_SCREEN)
                return this.getScreen(Video.INDEX_MAIN_SCREEN);
        }

        public getScreenshotFullpath(screenPath: string) {
                if (!screenPath) {
                        return undefined;
                }
                return Path.join(this.screenshotsFolder, screenPath);
        }

        public hasMissingScreenshots(): boolean {
                let missing = false;
                _.times(this.screenshots.length, (idx) => {
                        if (!this.screenshots[idx].path) {
                                missing = true;
                        }
                });
                return missing;
        }

        public match(search: string, people: Person[]): boolean {
                // return this.path.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) > 0;
                // const words = search.trim().toLocaleLowerCase().split(' ');
                // const words = _.compact(search.replace(/[\W]/g,' ').trim().toLocaleLowerCase().split(' '));
                const words = _.compact(search.split(' '));
                const tags = this.tags ? this.tags.toString().toLocaleLowerCase() : "";
                let data = this.path + " " + tags;

                // add the person properties to the searchable data
                const matchedPeople = _.intersection(this.people, people.map(p => p._id)).map(id => _.find(people, (p:Person) => p._id === id));
                _.each(matchedPeople, p => data += " " + p.name);

                data = data.toLocaleLowerCase();

                for (let i = 0; i < words.length; i++) {
                        let w = words[i].trim();
                        if (!data.includes(w)) {
                                return false;
                        }
                }
                
                return true;
        }

        public addTag(tag: string) {
                if (!this.tags) {
                        this.tags = [];
                }
                this.tags.push(tag);
        }
}