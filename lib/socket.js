(function() {
    'use strict';
    
    var path            = require('path'),
        
        findit          = require('findit'),
        io              = require('socket.io'),
        
        Socket,
        Clients         = [],
        ConNum          = 0,
        
        CHANNEL         = 'find-data';
    
    module.exports = function(options) {
        var o       = options || {},
            prefix  = o.prefix || '/webfind';
        
        if (o.socket)
            Socket = o.socket;
        else if (o.server)
            Socket = io.listen(o.server);
        else
            throw(Error('server or socket should be passed in options!'));
        
        Socket
            .of(prefix)
            .on('connection', function(socket) {
                onConnection(socket, o.onMsg, function(data) {
                    socket.emit(CHANNEL, data);
                });
            });
    };
    
    function onConnection(socket, onMsg, callback) {
        var msg, onDisconnect, onMessage,
            indexEmpty  = Clients.indexOf(null),
            onFind      = function(conNum, data) {
                var dir, name,
                    d   = data;
                
                if (data) {
                    name    = d.name;
                    dir     = d.dir;
                    
                    if (name && dir)
                        find(conNum, dir, name, callback);
                    else if (d.stop)
                        Clients[conNum].stop = true;
                }
            };
        
        if (!callback) {
            callback    = onMsg;
            onMsg       = null;
        }
        
         if (indexEmpty >= 0)
            ConNum = indexEmpty;
        else
            ConNum = Clients.length;
        
        if (!Clients[ConNum]) {
            msg = log(ConNum, 'find connected');
            
            Clients[ConNum]             = {
                stop: false
            };
            
            onMessage                   = function(conNum, command) {
                log(conNum, command);
                
                onFind(conNum, command);
            }.bind(null, ConNum),
            onDisconnect                = function(conNum) {
                 if (Clients.length !== conNum + 1) {
                    Clients[conNum] = null;
                } else {
                    Clients.pop();
                    --ConNum;
                }
                
                log(conNum, 'find disconnected');
                
                socket.removeListener(CHANNEL, onMessage);
                socket.removeListener('disconnect', onDisconnect);
            }.bind(null, ConNum);
            
            socket.on(CHANNEL, onMessage);
            socket.on('disconnect', onDisconnect);
        } else {
            msg = log(ConNum, ' in use. Reconnecting...\n');
            
            callback(null, {
                stdout: msg
            });
            
            socket.disconnect();
        }
    }
    
    function find(conNum, dir, name, callback) {
        var finder  = findit(dir),
            regExp  = wildToReg(name),
            onFind  = function (type, pathFull) {
                var command = Clients[conNum],
                    base    = path.basename(pathFull),
                    is      = regExp.test(base);
                
                if (command.stop)
                    finder.stop();
                else if (is)
                    callback({
                        type: type,
                        path: pathFull
                    });
            },
            
            onDir   = onFind.bind(null, 'dir'),
            onFile  = onFind.bind(null, 'file'),
            onLink  = onFind.bind(null, 'link');
        
        Clients[conNum].stop = false;
        
        finder
            .on('directory', onDir)
            .on('file', onFile)
            .on('link', onLink)
            .on('end', function() {
                callback({
                    done: true
                });
            })
            .on('error', function(error) {
                callback({
                    error: error.message
                });
            });
    }
    
    function wildToReg(wildcard) {
        var regExp;
        
        if (!wildcard)
            wildcard = '*';
        
        wildcard    = '^' + wildcard /* search from start of line */
            .replace('.', '\\.')
            .replace('*', '.*')
            .replace('?', '\\?');
        
        wildcard    += '$'; /* search to end of line */
        
        regExp      = new RegExp(wildcard);
        
        return regExp;
    }
    
    function log(connNum, str, typeParam) {
        var ret, 
            type       = ' ';
        
        if (str) {
            
            if (typeParam)
                type  += typeParam + ':';
            
            ret        = 'client #' + connNum + type;
            
            console.log(ret, str);
        }
        
        return ret;
    }
})();
