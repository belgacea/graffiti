const BackgroundWindow = require('./src/background/BackgroundWindow')
const Logger = require('./src/main/Logger')

BackgroundWindow.init();
window.addEventListener('error', (e) => { Logger.error(e, 'BackgroundWindow')})

// oldLog = console.log;
// console.log = (...s) => {
//     const container = document.getElementById('console')
//     const div = document.createElement("div");
//     const text = document.createTextNode(...s);
//     div.appendChild(text)
//     container.appendChild(div)
//     container.scrollHeight = container.scrollHeight;
//     oldLog(...s);
// }

// oldError = console.error;
// console.error = (...s) => {
//     const container = document.getElementById('console')
//     const div = document.createElement("div");
//     div.style.color = 'red'
//     const text = document.createTextNode(...s);
//     div.appendChild(text)
//     container.appendChild(div)
//     container.scrollHeight = container.scrollHeight;
//     oldError(...s);
// }