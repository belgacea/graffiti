const _ = require('lodash');
const Datastore = require('nedb');

let db;

exports.createOrOpen = function createOrOpen(remoteSettings) {
  // console.warn('TODO: remove callbacks and replace with promises');
  // console.warn('TODO: I think remoteSettings parameter is not necessary anymore, we'll see. Sometimes it is not used which can be confusing')
  // if (!global.appSettings) { // does not belong her (not the job of this function)
    global.appSettings = remoteSettings;
  // }
  db = new Datastore({ filename: appSettings.DatabasePath, autoload: true, timestampData: true });
};

exports.checkIsFirstStart = function checkIsFirstStart() {
  return new Promise((resolve, reject) => {
    db.find({ type: 'app-settings' }, function (err, docs) {
      if (docs && docs[0]) {
        // replace with user set value
        global.appSettings.ThumbnailFolder = docs[0].ThumbnailFolder;
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

exports.loadSettings = function loadSettings() {
  return new Promise((resolve, reject) => {
    db.find({ type: 'app-settings' }, function (err, docs) {
      if (docs && docs[0]) {
        // replace with user set value
        appSettings.ThumbnailFolder = docs[0].ThumbnailFolder;
        resolve(docs[0]);
      } else {
        resolve(null);
      }
    });
  });
};

exports.getSettings = function getSettings() {
  return new Promise((resolve, reject) => {
    db.findOne({ type: 'app-settings' }, function (err, doc) {
      if (err) {
        reject(err);
      } else {
        resolve(doc);
      }
    });
  });
};

exports.insert = function insert(doc) {
  return new Promise((resolve, reject) => {
    db.insert(doc, function (err, newDoc) {   // Callback is optional
      if (err) {
        reject(err);
      } else {
        resolve(newDoc);
      }
    });
  });
};

exports.update = function update(doc) {
  return new Promise((resolve, reject) => {
    db.update({ _id: doc._id }, doc, {}, function (err, numAffected) {
      if (err) {
        reject(err);
      } else {
        resolve(numAffected);
      }
    });
  });
};

exports.setFields = function setFields(id, replacement) {
  return new Promise((resolve, reject) => {
    db.update({ _id: id }, { $set: replacement }, {}, function (err, numReplaced) {
      if (err) {
        reject(err);
      } else {
        resolve(numReplaced);
      }
    });
  });
};

exports.setFieldsByType = function setFieldsByType(type, replacement) {
  return new Promise((resolve, reject) => {
    db.update({ type: type }, { $set: replacement }, {}, function (err, numReplaced) {
      if (err) {
        reject(err);
      } else {
        resolve(numReplaced);
      }
    });
  });
};

exports.updateAll = function updateAll(docs) {
  return new Promise((resolve, reject) => {
    const promises = docs.map((doc) => exports.update(doc));

    Promise.all(promises)
        .then((nums) => {
          const sum = nums.reduce((pv, cv) => pv + cv, 0);
          resolve(sum);
        })
        .catch((err) => {
          reject(err);
        });
  });
};
// TODO use it in  Persistence instead of have 2 getAll
exports.getAll = function getAll(type) {
  return new Promise((resolve, reject) => {
    db.find({ type: type }, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
};

exports.getDeleted = function getDeleted(type) {
  return new Promise((resolve, reject) => {
    db.find({ $and: [{ type: type }, { deleted: true }] }, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
};

exports.getByIds = function getByIds(ids) {
  return new Promise((resolve, reject) => {
    db.find({ _id: { $in: ids } }, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
};

exports.getBy = function getBy(crit) {
  return new Promise((resolve, reject) => {
    db.find(crit, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
};
/**
 * Returns the videos with 0 screenshots.
 */
exports.getVideosWithMissingScreenshots = function getVideosWithMissingScreenshots() {
  return new Promise((resolve, reject) => {
    const hasMissingScreenshots = function (doc) {
      const isEmpty = doc.screenshots === undefined || doc.screenshots.length === 0;
      return isEmpty || _.some(doc.screenshots, (screenshot) => !screenshot.path);
    };

    db.find({ type: 'video', $where: hasMissingScreenshots }, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
};

exports.remove = function remove(id) {
  return new Promise((resolve, reject) => {
    db.remove({ _id: id }, {}, function (err, numRemoved) {
      if (err) {
        reject(err);
      } else {
        resolve(numRemoved);
      }
    });
  });
};