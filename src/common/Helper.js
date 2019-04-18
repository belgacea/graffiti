const package = require('../../package.json');

exports.env = {
    isDev: () => { return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development.webpack' },
    isProd: () => { return process.env.NODE_ENV === 'production' },
    isUat: () => { return process.env.NODE_ENV === 'uat' },
    isTest: () => { return process.env.NODE_ENV === 'test' },
}

exports.app = {
    name: () => { return package.productName; },
    version: () => { return package.version; }
}

exports.thousandSeparator = (value, separator = ',') =>{
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}