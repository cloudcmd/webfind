'use strict';

const DIR = './';
const DIR_ROOT = __dirname + '/..';
const path = require('path');
const rendy = require('rendy');
const modules = require('../json/modules');

const Socket = require(DIR + 'socket');

module.exports = start;

module.exports.middle = (options) => {
    return getServe(options);
};

/*
 * @params options
 * 
 * server, onMsg, prefix, notMinify
 */
function start(options) {
    var middle,
        o           = options || {};
    
    middle  = getServe(options);
    
    Socket({
        server: o.server,
        socket: o.socket,
        prefix: o.prefix,
        onMsg: o.onMsg
    });
    
    return middle;
}

function checkOption(isOption) {
    var is;
    
    if (typeof isOption === 'function')
        is  = isOption();
    else if (isOption === undefined)
        is  = true;
    else
        is  = isOption;
    
    return is;
}

function getServe(options) {
    return serve.bind(null, options);
}

function serve(options, req, res, next) {
    var o           = options || {},
        isOnline    = checkOption(o.online),
        
        url         = req.url,
        prefix      = o.prefix || '/webfind',
        
        regExp      = new RegExp('^' + prefix),
        regExpMdls  = new RegExp('^' + prefix + '/modules.json'),
        
        isConsole   = url.match(regExp),
        isModules   = url.match(regExpMdls),
        
        URL         = prefix + '/webfind.js',
        PATH        = '/assets/js/webfind.js',
        sendFile    = function() {
            url = path.normalize(DIR_ROOT + url);
            res.sendFile(url);
        };
    
    if (!isConsole) {
        next();
    } else {
        if (url === URL)
            url = PATH;
        else
            url = url.replace(prefix, '');
        
        req.url = url;
        
        if (isModules) {
            modulesFunc(prefix, isOnline, req, res, next);
        } else {
            sendFile();
        }
    }
}

function modulesFunc(prefix, online, req, res) {
    let urls = [];
    let urlSocket = '';
    
    if (online) {
        urls = modules.map((m) => {
            return rendy(m.remote, {
                version: m.version
            });
        });
    } else {
        modules.forEach((m) => {
            if (m.name === 'socket')
                return urlSocket = m.local;
        });
        
        urls = [urlSocket];
    }
    
    res.type('json');
    res.send(urls);
}

