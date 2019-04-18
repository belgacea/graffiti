import * as React from 'react';
import * as _ from 'lodash';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';

import { IpcEvents } from '../common/Constants.js'
import PersonCircle from '../components/PersonCircle';
import Person from '../types/Person';
import Rule, { RuleTarget, RuleAlteration, RuleCondition } from '../types/Rule';
import SuggestiveInput from '../components/SuggestiveInput';
import ToastHelper from '../core/ToastHelper';
import * as myActions from '../redux/Actions'
import { Button } from '@blueprintjs/core';
import PersonStore from '../store/PersonStore';

interface IRulesReduxProps {
    peopleSuggestion?: Person[]
    rules: Rule[]
}

interface IRulesReduxActions {
    saveRule: (rule: Rule) => void
}

interface IRulesProps extends IRulesReduxProps, IRulesReduxActions {

}

interface IRulesState {
    condition: RuleCondition
    target: RuleTarget
    alteration: RuleAlteration
    pattern: string
    tags: string[]
    people: Person[]
}

class Rules extends React.Component<IRulesProps, IRulesState> {

    private readonly RuleConditionDefault: RuleCondition = RuleCondition.STARTS_WITH;
    private readonly RuleTargetDefault: RuleTarget = RuleTarget.NAME;
    private readonly RuleAlterationDefault: RuleAlteration = RuleAlteration.ADD_TAGS;

    constructor(props: IRulesProps) {
        super(props);
        console.log('props construtor:', props)
        this.state = {
            condition: this.RuleConditionDefault,
            target: this.RuleTargetDefault,
            alteration: this.RuleAlterationDefault,
            pattern: '',
            tags: [],
            people: []
        }
    }

    handleConditionChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ condition: parseInt(e.currentTarget.value) })
    }

    handleTargetChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ target: parseInt(e.currentTarget.value) })
    }

    handleAlterationChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (RuleAlteration.ADD_TAGS === parseInt(e.currentTarget.value)) {
            this.setState({ people: [] })
        }
        else if (RuleAlteration.ADD_PEOPLE === parseInt(e.currentTarget.value)) {
            this.setState({ tags: [] })
        }
        this.setState({ alteration: parseInt(e.currentTarget.value) })
    }

    handlePatternChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ pattern: e.target.value });
    }

    handleAdd = () => {
        if (this.state.pattern === '') {
            ToastHelper.error('The pattern is empty')
            return;
        }
        
        const rule = new Rule();
        rule.alteration = this.state.alteration;
        rule.condition = this.state.condition;
        rule.target = this.state.target;
        rule.pattern = this.state.pattern;

        if (this.state.alteration === RuleAlteration.ADD_PEOPLE) {
            if (this.state.people.length === 0) {
                ToastHelper.error('The people list is empty')
                return;
            }
            rule.people = this.state.people.map(p => p._id);
        }
        else if (this.state.alteration === RuleAlteration.ADD_TAGS) {
            if (this.state.tags.length === 0) {
                ToastHelper.error('The tag list is empty')
                return;
            }
            rule.tags = this.state.tags;
        }

        this.props.saveRule(rule);

        this.setState({
            condition: this.RuleConditionDefault,
            target: this.RuleTargetDefault,
            alteration: this.RuleAlterationDefault,
            pattern: '', tags: [], people: []
        })
    }

    handleSuggestiveInputChanged = (input) => {
        if (this.state.alteration === RuleAlteration.ADD_PEOPLE) {
            this.setState({ people: input })
        }
        else if (this.state.alteration === RuleAlteration.ADD_TAGS) {
            this.setState({ tags: [...this.state.tags, input] })
        }
    }

    onApplyRuleNow = (rule: Rule) => {
        console.log('applying rule now:', rule)
        ipcRenderer.send(IpcEvents.Background.ApplyRule, rule);

    }

    renderRule(rule: Rule) {
        const store = new PersonStore(this.props.peopleSuggestion);
        return (
            <div className='rule' key={rule._id}>
                <span className='rule-target'>{RuleTarget[rule.target]}</span>
                <span className='rule-condition'>{RuleCondition[rule.condition]}</span>
                <span className='rule-pattern'>{rule.pattern}</span>
                <span className='rule-alteration'>{RuleAlteration[rule.alteration]}</span>
                {rule.tags ? <span className='rule-tags'>{rule.tags.toString()}</span> : null}
                {rule.people ? <span className='rule-people'>{store.getPeopleByIds(rule.people).map(p => p.name).toString()}</span> : null}
                <Button text='Apply now' onClick={() => this.onApplyRuleNow(rule)} />
            </div>
        );
    }

    render() {
        let suggestions, values, renderTag, onValueCreated;
        if (this.state.alteration === RuleAlteration.ADD_PEOPLE) {
            suggestions = this.props.peopleSuggestion;
            values = this.state.people;
            renderTag = (tag) => tag.name;
        }
        else if (this.state.alteration === RuleAlteration.ADD_TAGS) {
            suggestions = [];
            values = this.state.tags;
            onValueCreated = this.handleSuggestiveInputChanged;
        }

        const ruleElements = (this.props.rules || []).map(r => this.renderRule(r))

        return (
            <div id="rules">
                <select onChange={this.handleTargetChanged} value={this.state.target}>
                    <option value={RuleTarget.NAME}>Name</option>
                    <option value={RuleTarget.PATH}>Path</option>
                </select>
                <select onChange={this.handleConditionChanged} value={this.state.condition}>
                    <option value={RuleCondition.STARTS_WITH}>Starts with</option>
                    <option value={RuleCondition.CONTAINS}>Contains</option>
                </select>
                <input type='text' value={this.state.pattern} onChange={this.handlePatternChanged} />
                <select onChange={this.handleAlterationChanged} value={this.state.alteration}>
                    <option value={RuleAlteration.ADD_TAGS}>Add tags</option>
                    <option value={RuleAlteration.ADD_PEOPLE}>Add people</option>
                </select>
                <SuggestiveInput
                    values={values}
                    suggestions={suggestions}
                    onChange={this.handleSuggestiveInputChanged}
                    renderSuggestion={(suggestion: Person) => <span><PersonCircle person={suggestion} hideTooltip={true} /><span className='name'>{suggestion.name}</span></span>}
                    onValueCreated={onValueCreated}
                    renderTag={renderTag}
                    disableNewValues={this.state.alteration === RuleAlteration.ADD_PEOPLE}
                />
                <button onClick={this.handleAdd}>Add rule</button>
                <div className='rules-list'>
                    {ruleElements}
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        peopleSuggestion: state.myReducer.people,
        rules: state.myReducer.rules,
    }
}

function mapDispatchToProps(dispatch): IRulesReduxActions {
    return {
        saveRule: rule => dispatch(myActions.saveRule(rule))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Rules)