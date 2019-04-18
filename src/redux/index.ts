import { combineReducers } from 'redux'
import { myReducer } from './Reducers'

const combinedReducers = combineReducers({
    myReducer
});

export default combinedReducers;
