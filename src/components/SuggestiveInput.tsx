import * as React from "react";
import * as _ from 'lodash'
import { Portal, MenuItem, Classes } from '@blueprintjs/core'
import { KeyCodes } from '../common/Constants.js'
import * as ReactList from 'react-list';

interface ISuggestiveInputProps {
    values: any[]
    suggestions?: any[]
    onChange: (values:any) => void
    onValueCreated?: (value:string) => void
    renderSuggestion?: (suggestion:any) => (JSX.Element | string)
    renderTag?: (suggestion:any) => (JSX.Element | string)
    disableNewValues?: boolean
    initText?: string
}

interface ISuggestiveInputState {
    hasFocus: boolean
    text: string
}

export default class SuggestiveInput extends React.Component<ISuggestiveInputProps, ISuggestiveInputState> {

    private filteredSuggestions: any[];
    private textInput:HTMLInputElement;
    constructor(props: ISuggestiveInputProps) {
        super(props);
        this.state = { 
            hasFocus: false,
            text: props.initText || ''
        };
        this.filteredSuggestions = [];
    }

    componentWillReceiveProps(nextProps: ISuggestiveInputProps) {
        this.setState({ text: nextProps.initText || '' });
    }

    focus = () => {
        this.textInput.click();
    }

    handleChange = values => {
        this.props.onChange(values);
    }

    handleFocus = () => {
        this.setState({ hasFocus: true })
    }

    handleBlur = () => {
        this.setState({ hasFocus: false })
    }

    handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ text: event.target.value });
    }

    filterSuggestions() {
        const { text } = this.state;
        const { suggestions, values } = this.props;
        if (!suggestions || suggestions.length === 0) {
            return [];
        }

        let filtered = _.filter(suggestions, s => !_.some(values, _.matches(s)));
        if (text) {
            // remove properties from string

            // filtered = _.filter(filtered, s => JSON.stringify(s).toLowerCase().indexOf(text.toLowerCase()) >= 0)
            filtered = _.filter(filtered, s => {
                let str = _.reduce(s, (result, value, key) => {
                    result = result + ' ' + value
                    return result;
                });
                return JSON.stringify(str).toLowerCase().indexOf(text.toLowerCase()) >= 0
            });
            console.warn('TODO: filtering can be improved, add prop filterSuggestions');
        }

        this.filteredSuggestions = filtered;
        return filtered;
    }

    handleAddSuggestion = (event:React.MouseEvent<HTMLLIElement>) => {
        const { values } = this.props;
        const index = +event.currentTarget.getAttribute("data-suggestion-index");
        const suggestion = this.filteredSuggestions[index];
        values.push(suggestion);
        this.handleChange(values);
        this.setState({ text: '' })
    }

    handleRemoveTag = (event: React.MouseEvent<HTMLSpanElement>) => {
        // using data attribute to simplify callback logic -- one handler for all children
        const index = +event.currentTarget.parentElement.getAttribute("data-tag-index");
        const { values } = this.props;
        values.splice(index, 1)
        this.props.onChange(values)
    }

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.keyCode) {
            case KeyCodes.Enter:
                if (!this.props.disableNewValues) {
                    const value = event.currentTarget.value.trim();
                    if (value.length > 0 && this.props.onValueCreated) {
                        this.props.onValueCreated(value); // TODO: test si on ne fournit pas onValueCreated
                        this.setState({ text: ''})
                    }
                    break;
                }
            case KeyCodes.Backspace: // use of backspace to remove tags
                const { text } = this.state;
                const { values } = this.props;
                if (text.length === 0 && values.length > 0) {
                    values.splice(values.length - 1, 1)
                    this.handleChange(values);
                }
                break;
        }
    }

    handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    }

    render() {
        const values = this.props.values || [];
        const suggestions = this.filterSuggestions();
        const suggestionElements = this.filterSuggestions().map(this.renderSuggestionItem);
        const tagElements = values.map(this.renderTagItem);
        return (
            <div className='suggestiveinput-container'>
                <div className="pt-input pt-tag-input pt-active">
                    { tagElements }
                    <input 
                        className="pt-input-ghost"
                        value={ this.state.text }
                        onChange={ this.handleTextChange }
                        onFocus={ this.handleFocus } onBlur={ this.handleBlur } onKeyDown={ this.handleKeyDown } onKeyUp={ this.handleKeyUp } />
                </div>

                { this.state.hasFocus && suggestionElements.length > 0 &&
                    <div className="suggestiveinput-suggestion-container pt-popover">
                        <ul className="pt-menu">
                            <ReactList
                                itemRenderer={index => { return this.renderSuggestionItem(suggestions[index], index) }}
                                length={suggestions.length}
                                type='uniform'
                            />
                        </ul>
                    </div>
                }
            </div>
        );
    }

    renderSuggestionItem = (suggestion, index) => {
        const renderedSuggestion = this.props.renderSuggestion ? this.props.renderSuggestion(suggestion) : suggestion;
        return (
            <li data-suggestion-index={index} key={'suggestion-' + index} onMouseDown={this.handleAddSuggestion}>
                <span className="pt-menu-item pt-popover-dismiss">
                    { renderedSuggestion }
                </span>
            </li>
        );
    }

    renderTagItem = (tag, index) => {
        const renderedTag = this.props.renderTag ? this.props.renderTag(tag) : tag;
        return (
            <span data-tag-index={index} key={'tag-' + index} className="pt-tag pt-tag-removable">
                { renderedTag }
                <button type="button" className="pt-tag-remove" onClick={ this.handleRemoveTag }></button>
            </span>
        );
    }
}
