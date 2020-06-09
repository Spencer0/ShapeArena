const { runCLI } = require('jest');
const { series } = require('gulp');
const { launch } = require('./src/server.js');

function launchServer() {
    server.launch();
}

async function test(cb) {
    await runCLI({'silent': true}, ["."], function(){cb()});
}

async function testVerbose() {
    await runCLI({'silent': false, 'verbose': true}, ["."]);
    return;
}

exports.default = series(test, launch);
exports.launch = launchServer;
exports.test = testVerbose;