const { ipcMain } = require('electron');
const Database = require('../main/Database');
const IpcEvents = require('../common/Constants').IpcEvents;

ipcMain.on(IpcEvents.Database.GetAll, (event, promiseId, type) => {
  Database.getAll(type)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.GetByIds, (event, promiseId, ids) => {
  Database.getByIds(ids)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.Insert, (event, promiseId, doc) => {
  Database.insert(doc)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.Update, (event, promiseId, doc) => {
  Database.update(doc)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.GetSettings, (event, promiseId) => {
  Database.getSettings()
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.GetVideosMissingScreenshots, (event, promiseId) => {
  Database.getVideosWithMissingScreenshots()
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.GetBy, (event, promiseId, crit) => {
  Database.getBy(crit)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.SetFields, (event, promiseId, id, replacement) => {
  Database.setFields(id, replacement)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.SetFieldsByType, (event, promiseId, type, replacement) => {
  Database.setFieldsByType(type, replacement)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.UpdateAll, (event, promiseId, docs) => {
  Database.updateAll(docs)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});

ipcMain.on(IpcEvents.Database.Remove, (event, promiseId, id) => {
  Database.remove(id)
    .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
    .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) })
});