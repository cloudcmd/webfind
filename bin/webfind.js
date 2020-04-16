#!/usr/bin/env node

'use strict';

const {argv} = process;
const argvLast = argv.slice().pop();

switch(argvLast) {
case '-v':
    version();
    break;

case '--v':
    version();
    break;

default:
    start();
}

function start() {
    const DIR = __dirname + '/../assets';
    const webfind = require('../');
    const http = require('http');
    const express = require('express');
    const app = express();
    const server = http.createServer(app);
    
    const port = process.env.PORT || /* c9           */
        process.env.app_port || /* nodester     */
        process.env.VCAP_APP_PORT || /* cloudfoundry */
        1337;
    
    const ip = process.env.IP || /* c9           */
                    '0.0.0.0';
    
    app .use(webfind({
        server,
        online: true,
    }))
        .use(express.static(DIR));
    
    server.listen(port, ip);
    
    console.log('url: http://' + ip + ':' + port);
}

function version() {
    const pack = require('../package.json');
    
    console.log('v' + pack.version);
}
