import * as _ from "lodash";
import { ipcRenderer } from 'electron';

import Video from '../types/Video'
import AppSettings from '../types/AppSettings'

import { IpcEvents } from '../common/Constants'

// import * as Util from '../common/Util'
const uuidv1 = require('uuid/v1');

// TODO see : http://electron.rocks/different-ways-to-communicate-between-main-and-renderer-process/

export default class Persistence {

        private static resolveReject: Array<{ resolve: Function; reject: Function }>;

        public static init() {
                Persistence.resolveReject = []
                ipcRenderer.on(IpcEvents.Database.Response, (event, response) => Persistence.handleIpcResponse(response))
        }

        private static handleIpcResponse(response: { promiseId: any; err: string; obj: any }) {
                const { promiseId, err, obj } = response;
                const p = Persistence.resolveReject[promiseId];
                delete Persistence.resolveReject[promiseId];
                if (err) {
                        p.reject(err);
                }
                else {
                        p.resolve(obj);
                }
        }

        public update(doc: any) {
                return new Promise((resolve: (n: number) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.Update, promiseId, doc)
                });
        }

        public updateAll(doc: any) {
                return new Promise((resolve: (n: number) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.UpdateAll, promiseId, doc)
                });
        }

        public insert(doc: any) {
                return new Promise((resolve, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.Insert, promiseId, doc)
                });
        }

        public remove(id: string) {
                return new Promise((resolve, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.Remove, promiseId, id)
                });
        }

        public getAll(type: string): Promise<any[]> {
                // TODO: type should be enum
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.GetAll, promiseId, type)
                });
        }

        public getByIds(ids: string[]): Promise<any[]> {
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        console.log('Persistence.getByIds', promiseId)
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.GetByIds, promiseId, ids)
                });
        }

        public getSettings(): Promise<AppSettings> {
                return new Promise((resolve: (doc: AppSettings) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.GetSettings, promiseId);
                });
        }

        public getVideosWithMissingScreenshots(): Promise<Video[]> {
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.GetVideosMissingScreenshots, promiseId)
                });
        }

        public getBy(crit: any): Promise<any> {
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.GetBy, promiseId, crit)
                });
        }

        public setFields(id, replacement): Promise<any> {
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.SetFields, promiseId, id, replacement);
                });
        }

        public setFieldsByType(type, replacement): Promise<any> {
                return new Promise((resolve: (docs: any[]) => any, reject) => {
                        const promiseId = uuidv1();
                        Persistence.resolveReject[promiseId] = { resolve, reject };
                        ipcRenderer.send(IpcEvents.Database.SetFieldsByType, promiseId, type, replacement);
                });
        }
}