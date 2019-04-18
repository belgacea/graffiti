import * as _ from 'lodash';

export default class Person {
        public static readonly TYPE: string = 'person';

        private type: string;
        public readonly _id: string;
        public name: string;
        public photo: string;
        public isFavorite: boolean;
        public tags: string[];
        public autoMatch: boolean;
        
        public constructor(name: string, photo: string, autoMatch: boolean = true) {
                this.type = Person.TYPE;
                this.name = name;
                this.photo = photo;
                this.isFavorite = false;
                this.autoMatch = autoMatch;
        }

        public match(search: string): boolean {
                // return this.name.toLowerCase().indexOf(search.toLowerCase()) >= 0;
                const words = this.name.toLocaleLowerCase().split(' ');
                for (let i = 0; i < words.length; i++) {
                        let w = words[i].trim();
                        if (!search.includes(w)) {
                                return false;
                        }
                }
                return true;
        }
}