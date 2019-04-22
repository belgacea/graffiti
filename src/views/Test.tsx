import * as React from "react";

import SuggestiveInput from '../components/SuggestiveInput'
import PersonCircle from '../components/PersonCircle'
import Person from '../types/Person'
export class Test extends React.Component<any, any> {
    constructor() {
        super({});
        this.state = {
            values: ['hello'],
            objects: []
        }
    }

    render() {
        return (
            <div style={{margin: '5px'}}>
                <div style={{margin: '10px'}}>
                {
                    // this.renderSuggestiveInput1()
                }
                {
                    this.renderSuggestiveInput2()
                }
                </div>
                coucou !!
                {
                    this.renderPersonCircle()
                }
            </div>
        );
    }

    renderPersonCircle() {
        const person = new Person('Clark Kent', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Superman_S_symbol.svg/1200px-Superman_S_symbol.svg.png');
        return <PersonCircle person={person} />
    }

    renderSuggestiveInput2() {
        const photo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Superman_S_symbol.svg/1200px-Superman_S_symbol.svg.png';
        const suggestions= [{name:'Clark Kent', photo: photo}, {name:'Superman', photo:photo}];
        
        return <div>
                objects <br/>
                <SuggestiveInput
                    key='mlkqsjdfml6541'
                    values={ this.state.objects }
                    suggestions={suggestions}
                    onChange={ values => { this.setState({values})} }
                    onValueCreated={ value => { const {values} = this.state; values.push(value); this.setState({values})}}
                    renderSuggestion={(suggestion:Person) => <span><PersonCircle person={suggestion}/><span className='name'>{suggestion.name}</span></span>}
                    renderTag={(tag) => tag.name }
                />
        </div>
    }

    renderSuggestiveInput1() {
        return <div>
                    texte normal<br/>
                    <SuggestiveInput 
                        key='lkjdfsmlqjlkjf*97'
                        values={ this.state.values }
                        suggestions={['abc','def','ghi']}
                        onChange={ values => { this.setState({values})} }
                        onValueCreated={ value => { const {values} = this.state; values.push(value); this.setState({values})}}
                    />
            </div>
    }
}