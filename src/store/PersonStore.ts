import * as _ from 'lodash'
import Person from '../types/Person'
import Video from '../types/Video';

export default class Persontore {

    private people:Person[];
    
    public constructor(people:Person[]) {
        this.people = people || [];
    }

    public getById(personId:string):Person {
        return _.find(this.people, p => p._id === personId);
    }

    public getPeopleByIds(personIds:string[]):Person[] {
        return _.filter(this.people, p => _.includes(personIds, p._id));
    }

    public addPeople(newPeople:Person[]):Person[] {
        let people = _.union(newPeople, this.people);
        return people
    }

    public orderByName() {
        return _.orderBy(this.people, ['name'], ['asc']);
    }
    
    public getPeopleByVideos(videos:Video[], excludeIds?:string[]):Person[] {
        let personIds = _.uniq(_.compact(_.flattenDeep(videos.map(v => v.people)))) as string[];
        if (excludeIds) {
            _.pull(personIds, ...excludeIds);
        }
        return this.getPeopleByIds(personIds);
    }

    public getByName(name: string): Person {
        return _.find(this.people, p => p.name.toLowerCase() === name.toLowerCase());
    }

    public static prepareUi(p:Person):Person {
        const person = new Person(undefined, undefined);
        _.merge(person, p);
        return person;
    }
}