import * as _ from 'lodash'
import Video from "./Video";
const Util = require('../common/Util');

export enum RuleTarget {
    NAME = 0,
    PATH = 1,
}

export enum RuleCondition {
    CONTAINS = 0,
    STARTS_WITH = 1,
}

export enum RuleAlteration {
    ADD_TAGS = 0,
    ADD_PEOPLE = 1,
}

/** TODO: WHEN TYPESCRIPT, change static functions to non-static, use video.getName() */

export default class Rule {
    public static readonly TYPE: string = 'rule';

    private type: string;
    public readonly _id: string;
    public pattern: string;
    public target: RuleTarget;
    public condition: RuleCondition;
    public alteration: RuleAlteration;
    public tags?: string[]
    public people?: string[]

    public constructor() {
        this.type = Rule.TYPE;
    }

    public static tryApply(rule: Rule, video: Video) {
        switch (rule.target) {
            case RuleTarget.NAME:
                return Rule.testRule(rule, video, Util.tempGetName(video.path).toLowerCase());
            case RuleTarget.PATH:
                return Rule.testRule(rule, video, video.path.toLowerCase());
        }
        return false;
    }

    private static testRule(rule: Rule, video: Video, text: string) {
        switch (rule.condition) {
            case RuleCondition.CONTAINS:
                if (text.indexOf(rule.pattern.toLowerCase()) > -1) {
                    Rule.applyAlteration(rule, video);
                    return true;
                }
            case RuleCondition.STARTS_WITH:
                if (text.startsWith(rule.pattern.toLowerCase())) {
                    Rule.applyAlteration(rule, video);
                    return true;
                }
                break;
        }
        return false;
    }

    private static applyAlteration(rule: Rule, video: Video) {
        switch (rule.alteration) {
            case RuleAlteration.ADD_TAGS:
                video.tags = _.uniq([...(video.tags || []), ...rule.tags])
                break;
            case RuleAlteration.ADD_PEOPLE:
                video.people = _.uniq([...(video.people || []), ...rule.people])
            default:
                break;
        }
    }
}