'use strict';

const path = require('path');

const findit = require('findit');
const io = require('socket.io');
const debug = require('debug');
const logConsole = debug('console');

let Socket;
const Clients = [];
let ConNum = 0;

const CHANNEL = 'find-data';

module.exports = (options) => {
    const o = options || {};
    const {
        prefix = '/webfind',
    } = o;
    
    if (o.socket)
        Socket = o.socket;
    else if (o.server)
        Socket = io.listen(o.server);
    else
        throw Error('server or socket should be passed in options!');
    
    Socket
        .of(prefix)
        .on('connection', (socket) => {
            onConnection(socket, o.onMsg, (data) => {
                socket.emit(CHANNEL, data);
            });
        });
};

function onConnection(socket, onMsg, callback) {
    const indexEmpty = Clients.indexOf(null);
    const onFind = (conNum, data) => {
        const d = data;
        
        if (!data)
            return;
        
        const {
            name,
            dir,
        } = d;
        
        if (name && dir)
            find(conNum, dir, name, callback);
        else if (d.stop)
            Clients[conNum].stop = true;
    };
    
    if (!callback) {
        callback = onMsg;
        onMsg = null;
    }
    
    if (indexEmpty >= 0)
        ConNum = indexEmpty;
    else
        ConNum = Clients.length;
    
    if (!Clients[ConNum]) {
        log(ConNum, 'find connected');
        
        Clients[ConNum] = {
            stop: false,
        };
        
        const onMessage = ((conNum, command) => {
            log(conNum, command);
            
            onFind(conNum, command);
        }).bind(null, ConNum);
        
        const onDisconnect = ((conNum) => {
            if (Clients.length !== conNum + 1) {
                Clients[conNum] = null;
            } else {
                Clients.pop();
                --ConNum;
            }
            
            log(conNum, 'find disconnected');
            
            socket.removeListener(CHANNEL, onMessage);
            socket.removeListener('disconnect', onDisconnect);
        }).bind(null, ConNum);
        
        socket.on(CHANNEL, onMessage);
        socket.on('disconnect', onDisconnect);
    } else {
        const stdout = log(ConNum, ' in use. Reconnecting...\n');
        
        callback(null, {
            stdout,
        });
        
        socket.disconnect();
    }
}

function find(conNum, dir, name, callback) {
    const finder = findit(dir);
    const regExp = wildToReg(name);
    const onFind = (type, pathFull) => {
        const command = Clients[conNum];
        const base = path.basename(pathFull);
        const is = regExp.test(base);
        
        if (command.stop)
            finder.stop();
        else if (is)
            callback({
                type,
                path: pathFull,
            });
    };
    
    const onDir = onFind.bind(null, 'dir');
    const onFile = onFind.bind(null, 'file');
    const onLink = onFind.bind(null, 'link');
    
    Clients[conNum].stop = false;
    
    finder
        .on('directory', onDir)
        .on('file', onFile)
        .on('link', onLink)
        .on('end', () => {
            callback({
                done: true,
            });
        })
        .on('error', (error) => {
            callback({
                error: error.message,
            });
        });
}

function wildToReg(wildcard) {
    if (!wildcard)
        wildcard = '*';
    
    wildcard = '^' + wildcard /* search from start of line */
        .replace('.', '\\.')
        .replace('*', '.*')
        .replace('?', '\\?');
    
    wildcard += '$'; /* search to end of line */
    
    return RegExp(wildcard);
}

function getType(type) {
    if (!type)
        return ' ';
    
    return ` ${type}:`;
}

function log(connNum, str, typeParam) {
    if (!str)
        return;
    
    const type = getType(typeParam);
    const ret = 'client #' + connNum + type + str;
    
    logConsole(ret);
    
    return ret;
}

