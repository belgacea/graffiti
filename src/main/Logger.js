const Datastore = require('nedb');
const Helper = require('../common/Helper');

var db;
exports.init = path => {
    console.warn('Logger disabled')
    // db = new Datastore({ filename: path, autoload: true, timestampData: false });
};

insert = line => {
    // if (db)
    //     db.insert(line);
}

exports.error = (err, description) => {
    const line = {
        type: 'error',
        appVersion: Helper.app.version(),
        uploaded: false,
        date: new Date(),
        error: JSON.stringify(err, ["message", "type"]),
        description: description
    };
    insert(line);
}

exports.message = message => {
    const line = {
        type: 'message',
        appVersion: Helper.app.version(),
        uploaded: false,
        date: new Date(),
        message: message
    }
    insert(line);
}

exports.getAll = () => {
    return new Promise((resolve, reject) => {
        db.find({}, (err, docs) => {
            resolve(docs);
        });
    })
}