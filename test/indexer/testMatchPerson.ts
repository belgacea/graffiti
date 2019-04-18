const assert = require('assert');
import Indexer from '../../src/background/Indexer'
import Person from '../../src/types/Person';

const person2: any = { _id: 'S', name: 'Clark Kent', autoMatch: true };
const person3: any = { _id: 'S', name: 'Clark Kent Junior', autoMatch: true };

describe('Indexer_matchPerson_1', function() {
    it('should match everyone (2 words name)', function() {
        const _matchable: any = [
            { path: 'a:\\superman\\a new adventure by clark kent.mpg' },
            { path: 'a:\\superman\\a.new.adventure.by.clark.kent.mpg' },
            { path: 'a:\\superman\\a_new_adventure_by_clark_kent.mpg' },
            { path: 'a:\\superman\\a_new_adventure_by.clark_kent.mpg' },
            { path: 'a:\\superman\\a-new-adventure-by-clark-kent.mpg' },
            { path: 'a:\\superman\\a new adventure by_clark-kent.mpg' },
            { path: 'a:\\superman\\a new adventure by Clark Kent.mpg' },
            { path: 'a:\\superman\\a new adventure by cLaRk keNt.mpg' },
            { path: 'a:\\superman\\a new adventure by clarkkent.mpg' },
            { path: 'a:\\superman\\a new adventure byclarkkent.mpg' },
            { path: 'Clark Kent a:\\superman\\a new adventure by.mpg' },
            { path: 'a:\\superman\\a new adventure\\Clark Kent\\video.mpg' },
            // the 3 below were removed from 'should not match anyone'
            { path: 'a:\\superman\\a new adventure by clark kentucky.mpg' },
            { path: 'a:\\superman\\a new adventure by kryptonclark_kent8_metropolis.mp4' },
            { path: 'a:\\superman\\a new adventure byclarkkentucky metropolis.mp4' },
        ];
        
        const allMatched = Indexer.matchPerson(_matchable, person2);
        if (allMatched.length !== _matchable.length) console.log(allMatched);
        assert.equal(allMatched.length, _matchable.length);
    });

    it('should match everyone (3 words name)', function() {
        const _matchable: any = [
            { path: 'a:\\superman\\a new adventure by clark kent junior.mpg' },
            { path: 'a:\\superman\\a new adventure by clark kent junior, john kent senior.mpg' },
            { path: 'a:\\superman\\a.new.adventure.by.clark.kent.junior.mpg' },
            { path: 'a:\\superman\\a_new_adventure_by_clark_kent_junior.mpg' },
            { path: 'a:\\superman\\a new adventure by clarkkentjunior.mpg' },
            { path: 'a:\\superman\\a new adventure byclarkkentjunior.mpg' },
            { path: 'Clark Kent Junior a:\\superman\\a new adventure by.mpg' },
        ];
        
        const allMatched = Indexer.matchPerson(_matchable, person3);
        if (allMatched.length !== _matchable.length) console.log(allMatched);
        assert.equal(allMatched.length, _matchable.length);
    });
});

describe('Indexer_matchPerson_2', function() {
    it('should not match anyone', function() {
        const _nonMatchable: any = [
            { path: 'a:\\superman\\a new adventure by keNt .mpg' },
            { path: 'a:\\superman\\a new adventure by keNt cLaRk.mpg' },
            { path: 'a:\\superman\\a new adventure by cLaRk .mpg' },
        ];
        
        const shouldBeEmptyArray = Indexer.matchPerson(_nonMatchable, person2);
        if (shouldBeEmptyArray.length > 0) console.log(shouldBeEmptyArray);
        assert.equal(shouldBeEmptyArray.length, 0);
    })
})

describe('Indexer_matchPerson_3', function() {
    it('should match only one (restrictive match)', function() {
        const _firstMatchable: any = [
            { path: 'a:\\superman\\a new adventure by clark kent.mpg' },
            { path: 'a:\\superman\\a new adventure by clark kentucky.mpg' },
        ];
        
        const shouldContainOneArray = Indexer.matchPerson(_firstMatchable, person2);
        if (shouldContainOneArray.length !== 1) console.log(person2, '-', shouldContainOneArray);
        assert.equal(shouldContainOneArray.length, 1);
    })
})
