'use strict';

const DIR = './';
const DIR_ROOT = __dirname + '/..';
const path = require('path');
const join = require('join-io');
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
    const o = options || {};
    const middle = getServe(options);
    
    Socket({
        server: o.server,
        socket: o.socket,
        prefix: o.prefix,
        onMsg: o.onMsg,
    });
    
    return middle;
}

function checkOption(isOption) {
    let is;
    
    if (typeof isOption === 'function')
        is = isOption();
    else if (isOption === undefined)
        is = true;
    else
        is = isOption;
    
    return is;
}

function getServe(options) {
    return serve.bind(null, options);
}

function serve(options, req, res, next) {
    let joinFunc;
    let {url} = req;
    
    const o = options || {};
    const isOnline = checkOption(o.online);
    const {
        prefix = '/webfind',
    } = o;
    const regExp = new RegExp('^' + prefix);
    const regExpJoin = new RegExp('^' + prefix + '/join');
    const regExpMdls = new RegExp('^' + prefix + '/modules.json');
    const isConsole = url.match(regExp);
    const isJoin = url.match(regExpJoin);
    const isModules = url.match(regExpMdls);
    const URL = `${prefix}/webfind.js`;
    const PATH = '/assets/js/webfind.js';
    
    const sendFile = function() {
        url = path.normalize(DIR_ROOT + url);
        res.sendFile(url);
    };
    
    if (!isConsole)
        return next();
    
    if (url === URL)
        url = PATH;
    else
        url = url.replace(prefix, '');
    
    req.url = url;
    
    if (isModules) {
        modulesFunc(prefix, isOnline, req, res);
    } else if (isJoin) {
        joinFunc = join({
            dir : DIR_ROOT,
        });
        
        joinFunc(req, res, next);
    } else {
        sendFile();
    }
}

function modulesFunc(prefix, online, req, res) {
    let urls = [];
    let urlSocket = '';
    let urlJoin = '';
    
    if (online) {
        urls = modules.map((m) => {
            return rendy(m.remote, {
                version: m.version,
            });
        });
    } else {
        urlJoin = prefix + '/join';
        for (const m of modules) {
            if (m.name === 'socket') {
                urlSocket = m.local;
                continue;
            }
            
            urlJoin += ':' + m.local;
        }
        
        urls = [urlJoin, urlSocket];
    }
    
    res.type('json');
    res.send(urls);
}

