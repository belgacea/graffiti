const assert = require('assert');
import Rule, { RuleTarget, RuleWhen, RuleAlteration } from '../../src/types/Rule'
import Video from '../../src/types/Video';

const video = new Video('a:\\test\\ufc.video.mp4');
const rule = new Rule();
rule.target = RuleTarget.NAME;
rule.when = RuleWhen.STARTS_WITH;
rule.alteration = RuleAlteration.ADD_TAGS;
rule.tags = ['Superman', 'Clark Kent'];
rule.pattern = 'ufc.';

// npm run test-ts -- --grep "Indexer_stat"
describe('Rule_1', function () {
    it('should apply the rule (name starts_with add_tags)', function () {
        assert.equal(rule.tryApply(video), true);
        console.log(video)
    });
})
describe('Rule_2', function() {
    it('should apply the rule (name starts_with add_people)', function () {
        rule.alteration = RuleAlteration.ADD_PEOPLE;
        rule.people = ['s6f54sdf46df']
        assert.equal(rule.tryApply(video), true);
        console.log(video)
    });
})
describe('Rule_3', function() {
    it('should apply the rule (name contains add_tags)', function () {
        rule.when = RuleWhen.CONTAINS;
        rule.pattern = 'abc'
        assert.equal(rule.tryApply(video), true);
        console.log(video)
    });
})
describe('Rule_4', function() {
    it('should apply the rule (name contains add_people)', function () {
        rule.when = RuleWhen.CONTAINS;
        rule.alteration = RuleAlteration.ADD_PEOPLE;
        rule.people = ['s6f54sdf46df']
        rule.pattern = 'abc'
        assert.equal(rule.tryApply(video), true);
        console.log(video)
    });
})
describe('Rule_5', function() {
    it('should apply the rule (path contains add_tags)', function () {
        rule.target = RuleTarget.PATH;
        rule.when = RuleWhen.CONTAINS;
        rule.pattern = 'truc'
        assert.equal(rule.tryApply(video), true);
        console.log(video)
    });
})
