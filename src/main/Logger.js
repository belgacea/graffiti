const Datastore = require('nedb');
const Helper = require('../common/Helper');

let db;

exports.init = function init(path) {
    console.warn('Logger disabled');
    // db = new Datastore({ filename: path, autoload: true, timestampData: false });
};

function insert(line) {
    // if (db)
    //     db.insert(line);
}

exports.error = function error(err, description) {
    const line = {
        type: 'error',
        appVersion: Helper.app.version(),
        uploaded: false,
        date: new Date(),
        error: JSON.stringify(err, ["message", "type"]),
        description: description,
    };
    insert(line);
};

exports.message = function message(message) {
    const line = {
        type: 'message',
        appVersion: Helper.app.version(),
        uploaded: false,
        date: new Date(),
        message: message,
    };
    insert(line);
};

exports.getAll = function getAll() {
    return new Promise((resolve, reject) => {
        db.find({}, function (err, docs) {
            if (err) {
                reject(err);
            } else {
                resolve(docs);
            }
        });
    });
};