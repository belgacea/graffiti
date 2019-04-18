import Video from "./Video";

export enum RuleTarget {
    NAME = 0,
    PATH = 1,
}

export enum RuleWhen {
    CONTAINS = 0,
    STARTS_WITH = 1,
}

export enum RuleAlteration {
    ADD_TAGS = 0,
    ADD_PEOPLE = 1,
}

export default class Rule {
    public static readonly TYPE: string = 'rule';

    private type: string;
    public readonly _id: string;
    public pattern: string;
    public target: RuleTarget;
    public when: RuleWhen;
    public alteration: RuleAlteration;
    public tags?: string[]
    public people?: string[]

    public constructor() {
        this.type = Rule.TYPE;
    }

    public tryApply(video: Video) {
        switch (this.target) {
            case RuleTarget.NAME:
                return this.testRule(video, video.getName().toLowerCase());
            case RuleTarget.PATH:
                return this.testRule(video, video.path.toLowerCase());
        }
        return false;
    }

    private testRule(video: Video, text: string) {
        switch (this.when) {
            case RuleWhen.CONTAINS:
                if (text.indexOf(this.pattern.toLowerCase()) > -1) {
                    this.applyAlteration(video);
                    return true;
                }
            case RuleWhen.STARTS_WITH:
                if (text.startsWith(this.pattern.toLowerCase())) {
                    this.applyAlteration(video);
                    return true;
                }
                break;
        }
        return false;
    }

    private applyAlteration(video: Video) {
        switch (this.alteration) {
            case RuleAlteration.ADD_TAGS:
                video.tags = [...(video.tags || []), ...this.tags]
                break;
            case RuleAlteration.ADD_PEOPLE:
                video.people = [...(video.people || []), ...this.people]
            default:
                break;
        }
    }
}