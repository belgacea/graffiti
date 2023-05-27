const { ipcMain } = require('electron');
const Database = require('../main/Database');
const IpcEvents = require('../common/Constants').IpcEvents;

const handleDatabaseRequest = (event, promiseId, promise) => {
  promise
      .then(obj => { event.sender.send(IpcEvents.Database.Response, { promiseId, undefined, obj }) })
      .catch(err => { event.sender.send(IpcEvents.Database.Response, { promiseId, err }) });
};

ipcMain.on(IpcEvents.Database.GetAll, (event, promiseId, type) => {
  handleDatabaseRequest(event, promiseId, Database.getAll(type));
});

ipcMain.on(IpcEvents.Database.GetByIds, (event, promiseId, ids) => {
  handleDatabaseRequest(event, promiseId, Database.getByIds(ids));
});

ipcMain.on(IpcEvents.Database.Insert, (event, promiseId, doc) => {
  handleDatabaseRequest(event, promiseId, Database.insert(doc));
});

ipcMain.on(IpcEvents.Database.Update, (event, promiseId, doc) => {
  handleDatabaseRequest(event, promiseId, Database.update(doc));
});

ipcMain.on(IpcEvents.Database.GetSettings, (event, promiseId) => {
  handleDatabaseRequest(event, promiseId, Database.getSettings());
});

ipcMain.on(IpcEvents.Database.GetVideosMissingScreenshots, (event, promiseId) => {
  handleDatabaseRequest(event, promiseId, Database.getVideosWithMissingScreenshots());
});

ipcMain.on(IpcEvents.Database.GetBy, (event, promiseId, crit) => {
  handleDatabaseRequest(event, promiseId, Database.getBy(crit));
});

ipcMain.on(IpcEvents.Database.SetFields, (event, promiseId, id, replacement) => {
  handleDatabaseRequest(event, promiseId, Database.setFields(id, replacement));
});

ipcMain.on(IpcEvents.Database.SetFieldsByType, (event, promiseId, type, replacement) => {
  handleDatabaseRequest(event, promiseId, Database.setFieldsByType(type, replacement));
});

ipcMain.on(IpcEvents.Database.UpdateAll, (event, promiseId, docs) => {
  handleDatabaseRequest(event, promiseId, Database.updateAll(docs));
});

ipcMain.on(IpcEvents.Database.Remove, (event, promiseId, id) => {
  handleDatabaseRequest(event, promiseId, Database.remove(id));
});