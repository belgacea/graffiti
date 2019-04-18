import * as React from "react";
import * as ReactDOM from "react-dom";
import { remote } from 'electron';
import { ipcRenderer } from 'electron';
import * as Mousetrap from 'mousetrap'
import { Provider } from 'react-redux'
import { IpcEvents } from './common/Constants'
import * as Logger from './main/Logger'
import configureStore from './redux/Store'
import { loadVideos, loadPeople, injectVideos, routeChanged, replaceVideos, deletePerson, loadRules } from './redux/Actions'
import * as Analytics from './common/Analytics';
import * as Helper from './common/Helper';

import { Test } from "./views/Test";
import Layout from "./views/Layout";
import VideoDetails from "./views/VideoDetails";
import PersonDetails from "./views/PersonDetails";
import VideoList from "./views/VideoList";
import Settings from "./views/Settings";
import Duplicates from "./views/Duplicates";
import CleanUp from "./views/CleanUp";
import SearchResults from "./views/SearchResults";

import './stylesheets/index.css';
import './stylesheets/footer.css';
import './stylesheets/videodetails.css';
import './stylesheets/persondetails.css';
import './stylesheets/scrollbar.css';
import './stylesheets/screenshot.css';
import './stylesheets/person.css';
import './stylesheets/settings.css';
import './stylesheets/suggestiveinput.css';
import './stylesheets/peoplebar.css';
import './stylesheets/searchresults.css';
import './stylesheets/duplicates.css';
import './stylesheets/modal.css';
import './stylesheets/rules.css';

import VideoStore from './store/VideoStore';
import Router from './core/Router';
import ToastHelper from './core/ToastHelper';
import Persistence from './core/Persistence';
import DatabaseUpgrade from "./core/DatabaseUpgrade";
import Rules from "./views/Rules";

console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

let data:Promise<any>; // data needed for the app to function properly, wait until loaded

const navigated = () => {
    let view = <h1>No view for {window.location.hash}</h1>;
    let route = Router.parse(window.location.hash);
    Analytics.screenview(route.name);
    switch(route.name) {
        case 'Home':
            view = withLayout(<VideoList />)
            store.dispatch(routeChanged(route.name))
            break;
        case 'VideoDetails':
            view = withLayout(<VideoDetails {...route.options}/>)
            break;
        case 'PersonDetails':
            view = withLayout(<PersonDetails {...route.options}/>)
            break;
        case 'SearchResults':
            view = withLayout(<SearchResults {...route.options}/>)
            break;
        case 'Settings':
            view = withLayout(<Settings />)
            break;
        case 'Duplicates':
            view = withLayout(<Duplicates />)
            break;
        case 'CleanUp':
            view = withLayout(<CleanUp />)
            break;
        case 'Rules':
            view = withLayout(<Rules />)
            break;
        case 'Test':
            view = <Test />
            break;
    }

    data.then(() => {
        ReactDOM.render(view, document.getElementById('content'))
    })
};

const store = configureStore(undefined);
const dbExists:boolean = remote.getGlobal('dbExists');
Persistence.init();
if (dbExists) {
    data = Promise.all([
        store.dispatch(loadVideos()),
        store.dispatch(loadPeople()),
        store.dispatch(loadRules()),
    ])
    .then(() => {
        console.log('Startup finished')
        ipcRenderer.send(IpcEvents.Startup.Ready);
    });
}
else {
    data = Promise.resolve();
    ipcRenderer.send(IpcEvents.Startup.Ready);
}
    
const withLayout = (view) => {
    return (
        <Provider store={store}>
            <Layout>{view}</Layout>
        </Provider>
    );
}

const appSettings:any = remote.getGlobal('appSettings');
Logger.init(appSettings.ErrorLogPath);
Router.init();
ToastHelper.init()
const userDataPath:any = remote.getGlobal('userDataPath');
Analytics.init(userDataPath, undefined, screen);
if (dbExists) {
    DatabaseUpgrade.Verify().then(() => {
        navigated();
    });
}
else {
    navigated();
}

window.addEventListener('hashchange', navigated, false);
window.addEventListener('error', error => { Logger.error(error, 'Window'); console.log('Error in window', error) }); // TODO look for  try/catch and .catch of promises
window.addEventListener('auxclick', (e) => { console.log(e) }, true);

Mousetrap.bind('ctrl+f', () => { 
    let input = document.getElementById('search-input') as HTMLInputElement;
    // if (input === document.activeElement) {
    // }
    // else {
        input.focus();
        input.setSelectionRange(0, input.value.length);
    // }
});
Mousetrap.bind('ctrl+h', () => { Router.to.Home() });

ipcRenderer.on(IpcEvents.Video.RefreshStore, (event) => {
    console.warn('BAD, do not use RefreshStore, just refresh the targeted videos');
    store.dispatch(loadVideos());
});

ipcRenderer.on(IpcEvents.Video.AddedMultiple, (event, videos) => {
    if (videos && videos.length > 0) {
        ToastHelper.info(videos.length + ' new videos since last time');
        store.dispatch(injectVideos(videos));
    }
});

ipcRenderer.on(IpcEvents.Video.Added, (event, video) => {
    if (video) {
        ToastHelper.info('1 new video added');
        store.dispatch(injectVideos([video]));
    }
});

ipcRenderer.on(IpcEvents.Video.ReplaceMultiple, (event, videos) => {
    if (videos && videos.length > 0) {
        ToastHelper.info(videos.length + ' videos changed since last time');
        store.dispatch(replaceVideos(videos));
    }
});

ipcRenderer.on(IpcEvents.Video.ReplaceOne, (event, video) => {
    if (video) {
        ToastHelper.info('1 video changed');
        store.dispatch(replaceVideos([video]));
    }
});

ipcRenderer.on(IpcEvents.Person.Deleted, (event, person) => {
    if (person) {
        ToastHelper.success('"' + person.name + '" deleted');
        store.dispatch(deletePerson(person));
    }
});

ipcRenderer.on(IpcEvents.Toast.Error, (event, message) => {
    ToastHelper.error(message);
});

ipcRenderer.on(IpcEvents.Toast.Info, (event, message) => {
    ToastHelper.info(message);
});

ipcRenderer.on(IpcEvents.Toast.Success, (event, message) => {
    ToastHelper.success(message);
});
/*
if (Helper.env.isProd()) {
    const bt = require('backtrace-js');
    bt.initialize({
    endpoint: "",
    token: "",
    attributes: {
        'userid': Analytics.getUserId(userDataPath),
        'version': Helper.app.version()
    }
    });
}
*/
// setTimeout(() => {
//   console.error('throwing error')
//   throw new Error('Backtrace CrashReporter test');
//   // process.crash();
// }, 10000);