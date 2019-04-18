exports.Constants = {
        VideoTypes: ['.avi', '.mov', '.wmv', '.mp4', '.m4v', '.mkv', '.3gp', '.divx', '.flv', '.mpg', '.mpeg', '.f4v', '.ts', '.webm', '.asf', '.m2ts']
};

exports.IpcEvents = {
        Startup: {
                Ready: 'startup:ready',
                IsFirstStart: 'startup:isFirstStart',
                FirstStart: {
                        BeginIndexing: 'startup:first-start:begin-indexing',
                        Progress: 'startup:first-start:progress',
                        FinishedIndexing: 'startup:first-start:finished-indexing'
                }
        },
        Video: {
                RefreshStore: 'videos:refresh-store',
                ReplaceOne: 'video:replace-one',
                Added: 'video:added',
                AddedMultiple: 'video:added-multiple',
                OpenContainingFolder: 'video:open-containing-folder',
                Explorer: 'video:explorer',
                ReplaceMultiple: 'video:refresh-multiple'
        },
        Screenshot: {
                CreatedVideo: 'screenshot:created-video',
        },
        Playback: {
                Play: 'playback:play'
        },
        Background: {
                Test: 'background:test',
                Ready: 'background:ready',
                Start: 'background:start',
                ScreenshotsOneVideo: 'background:screenshots-one-video',
                ScreenshotStartAll: 'background:screenshots:start-all',
                MatchPerson: 'background:videos:match-person',
                FirstStart: {
                        BeginIndexing: 'background:first-start:begin-indexing'
                },
                DeletePerson: 'background:delete-person',
                Duplicates: {
                        Start: 'background:duplicates:start',
                        Progress: 'background:duplicates:progress',
                        Result: 'background:duplicates:result'
                },
                CleanUp: {
                        Start: 'background:clean-up:start',
                        Progress: 'background:clean-up:progress',
                        Result: 'background:clean-up:result'
                },
                ApplyRule: 'background-apply-rule'
        },
        Person: {
                Deleted: 'person:deleted'
        },
        Toast: {
                Error: 'toast:error',
                Info: 'toast:info',
                Success: 'toast:success'
        },
        Database: {
                Response: 'db:response',
                Update: 'db:update',
                UpdateAll: 'db:updateAll',
                GetAll: 'db:getAll',
                GetByIds: 'db:getByIds',
                Insert: 'db:insert',
                GetSettings: 'db:getSettings',
                GetVideosMissingScreenshots: 'db:getVideosWithMissingScreenshots',
                GetBy: 'db:getBy',
                SetFields: 'db:setFields',
                SetFieldsByType: 'db:setFieldsByType',
                Remove: 'db:remove'
        }
}

exports.KeyCodes = {
        Enter: 13,
        Escape: 27,
        Backspace: 8
}

exports.ReduxActions = {
        SEARCH: 'SEARCH',
        LOAD_VIDEOS_LIST_SUCCESS: 'LOAD_VIDEOS_LIST_SUCCESS',
        LOAD_PERSON_DETAILS_SUCCES: 'LOAD_PERSON_DETAILS_SUCCES',
        LOAD_PEOPLE_SUCCESS: 'LOAD_PEOPLE_SUCCESS',
        CREATE_PERSON: 'CREATE_PERSON',
        DELETE_PERSON: 'DELETE_PERSON',
        LOAD_VIDEO_DETAILS_SUCCES: 'LOAD_VIDEO_DETAILS_SUCCES',
        SAVE_ATTACHED_PEOPLE_SUCCESS: 'SAVE_ATTACHED_PEOPLE_SUCCESS',
        REPLACE_VIDEOS: 'REPLACE_VIDEOS',
        MARK_FAVORITE_SUCCESS: 'MARK_FAVORITE_SUCCESS',
        OPEN_EDIT_PERSON_MODAL: 'OPEN_EDIT_PERSON_MODAL',
        CLOSE_EDIT_PERSON_MODAL: 'CLOSE_EDIT_PERSON_MODAL',
        INJECT_VIDEOS: 'INJECT_VIDEOS',
        ROUTE_CHANGED: 'ROUTE_CHANGED',
        SAVE_RULE: 'SAVE_RULE',
        LOAD_RULES: 'LOAD_RULES'
}