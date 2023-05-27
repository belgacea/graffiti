// https://kilianvalkhof.com/2018/apps/using-google-analytics-to-gather-usage-statistics-in-electron/
const Helper = require('../common/Helper');
const ua = require('universal-analytics');
const uuid = require('uuid/v4');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

// const UAT_TRACKING_CODE = 'UA-117105247-5';
// const PROD_TRACKING_CODE = 'UA-117105247-6';
let user;

exports.init = function init(userDataPath, os, screen) {
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath);
    }

    let userId = undefined;
    const userIdPath = path.join(userDataPath, 'userId');

    if (fs.existsSync(userIdPath)) {
        userId = fs.readFileSync(userIdPath, "utf8");
    }

    if (!userId) {
        userId = uuid();
        fs.writeFileSync(userIdPath, userId);
    }

    if (Helper.env.isProd()) {
        user = ua('UA-XXXXXXXXX', userId);
    } else if (Helper.env.isUat()) {
        user = ua('UA-XXXXXXXXX', userId).debug();
    }

    if (user) {
        user.set('applicationVersion', Helper.app.version());
        if (os) user.set('cd1', os);
        if (screen) user.set('cd2', `${screen.width}x${screen.height}`);
    }
};

exports.getUserId = function getUserId(userDataPath) {
    let userId = undefined;
    const userIdPath = path.join(userDataPath, 'userId');
    if (fs.existsSync(userIdPath)) {
        userId = fs.readFileSync(userIdPath, "utf8");
    }
    return userId;
};

exports.screenview = function screenview(screenName) {
    if (user) {
        user.screenview(screenName, Helper.app.name(), Helper.app.version()).send();
    }
};

function event(params) {
    if (user) {
        user.event(params).send();
    }
}

exports.events = {
    // eventCategory;eventAction;eventLabel;eventValue
    BLANK: (eventLabel, eventValue) => event({ eventCategory: '', eventAction: '', eventLabel, eventValue }),

    APP_CLOSING: () => event({ eventCategory: 'general', eventAction: 'closing' }),

    // CLIENT_OS: (eventValue) => event({ eventCategory: 'client', eventAction: 'os', eventValue }),
    // CLIENT_SCREEN: (eventValue) => event({ eventCategory: 'client', eventAction: 'os', eventValue }),
    
    STARTUP_LOAD_VIDEO: (eventValue) => event({ eventCategory: 'startup', eventAction: 'load_video', eventValue }),
    STARTUP_LOAD_PEOPLE: (eventValue) => event({ eventCategory: 'startup', eventAction: 'load_people', eventValue }),

    VIDEO_SEARCH: (eventLabel) => event({ eventCategory: 'video', eventAction: 'search', eventLabel }),
    VIDEO_ATTACH_PERSON: () => event({ eventCategory: 'video', eventAction: 'attach_person' }),
    VIDEO_TAG: (eventValue) => event({ eventCategory: 'video', eventAction: 'tag', eventValue }),
    VIDEO_PLAY: () => event({ eventCategory: 'video', eventAction: 'play' }),
    VIDEO_OPEN_CONTAINING_FOLDER: () => event({ eventCategory: 'video', eventAction: 'open_containing_folder' }),
    VIDEO_EXPLORE_FOLDER: () => event({ eventCategory: 'video', eventAction: 'explore_folder' }),
    VIDEO_MAKE_SCREENSHOTS: () => event({ eventCategory: 'video', eventAction: 'make_screenshots' }),
    VIDEO_REMOVE: () => event({ eventCategory: 'video', eventAction: 'remove' }),

    PEOPLE_SEARCH: _.debounce((eventLabel) => event({ eventCategory: 'people', eventAction: 'search', eventLabel }), 5000),
    PEOPLE_ADD: (eventLabel) => event({ eventCategory: 'people', eventAction: 'add', eventLabel }),
    PEOPLE_EDIT: (eventLabel) => event({ eventCategory: 'people', eventAction: 'edit', eventLabel }),
    PEOPLE_REMOVE: (eventLabel) => event({ eventCategory: 'people', eventAction: 'remove', eventLabel }),
    PEOPLE_TAG: (eventLabel) => event({ eventCategory: 'people', eventAction: 'tag', eventLabel }),

    SETTINGS_VIDEOS_FOLDER_ADD: () => event({ eventCategory: 'settings', eventAction: 'videos_folder_add' }),
    SETTINGS_VIDEOS_FOLDER_REMOVE: () => event({ eventCategory: 'settings', eventAction: 'videos_folder_remove' }),
    SETTINGS_VIDEOS_REALTIME: (eventLabel) => event({ eventCategory: 'settings', eventAction: 'videos_realtime', eventLabel }),
    SETTINGS_VIDEOS_STARTUP_CRAWL: (eventLabel) => event({ eventCategory: 'settings', eventAction: 'videos_startup_crawl_one', eventLabel }),

    SETTINGS_IMAGES_PEOPLE_PATH_CHANGED: () => event({ eventCategory: 'settings', eventAction: 'images_people_path_changed' }),
    SETTINGS_IMAGES_SCREENSHOTS_PATH_CHANGED: () => event({ eventCategory: 'settings', eventAction: 'images_screenshots_path_changed' }),
    SETTINGS_IMAGES_STARTUP_MAKE_SCREEENSHOTS: (eventLabel) => event({ eventCategory: 'settings', eventAction: 'images_startup_make_screenshots', eventLabel }),
    SETTINGS_IMAGES_SCREENSHOTS_MAKE_ON_DETAILS: (eventLabel) => event({ eventCategory: 'settings', eventAction: 'images_screenshots_on_details', eventLabel }),
    SETTINGS_IMAGES_SCREENSHOTS_PARALLEL: (eventValue) => event({ eventCategory: 'settings', eventAction: 'images_screenshots_parallel', eventValue }),

    DUPLICATES_START: () => event({ eventCategory: 'duplicates', eventAction: 'start' }),
    DUPLICATES_FINISHED: (eventValue) => event({ eventCategory: 'duplicates', eventAction: 'finished', eventValue }),
    DUPLICATES_DELETE: (eventValue) => event({ eventCategory: 'duplicates', eventAction: 'delete', eventValue }),

    CLEAN_UP_START: () => event({ eventCategory: 'cleanUp', eventAction: 'start' }),
    CLEAN_UP_DELETE: (eventValue) => event({ eventCategory: 'cleanUp', eventAction: 'delete', eventValue }),
    CLEAN_UP_MOVE_TO_BIN: (eventValue) => event({ eventCategory: 'cleanUp', eventAction: 'move_to_bin', eventValue }),
    CLEAN_UP_RESTORE: (eventValue) => event({ eventCategory: 'cleanUp', eventAction: 'restore', eventValue }),
};