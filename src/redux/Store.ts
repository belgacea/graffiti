import { createStore, applyMiddleware } from 'redux'
import combinedReducers from './index'
// import reduxImmutableStateInvariant from 'redux-immutable-state-invariant'
import thunk from 'redux-thunk'
// const store = createStore()

// const unsubscribe = store.subscribe(() => {
//     console.log('something happened')
// })

export default function configureStore(initialState) {
    return createStore(
        combinedReducers,
        initialState,
        applyMiddleware(thunk)
    )
}
