const fs = require('fs')

const assert = require('assert');
const Logger = require('../src/main/Logger')


describe('Logging', function() {
    it('should log errors', function(done) {
        Logger.init(appSettings.ErrorLogPath);
        if (fs.existsSync(appSettings.ErrorLogPath)) fs.unlinkSync(appSettings.ErrorLogPath);
        
        Promise.all([
            Logger.error(new Error('First error object')),
            Logger.message('A message')
        ])
        .catch(err => console.error(err))
        .then(() => {
            Logger.getAll()
            .then(results => {
                assert.equal(results.length, 2);
                done();
            });
        });
    });
});
