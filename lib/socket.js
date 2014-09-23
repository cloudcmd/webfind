(function() {
    'use strict';
    
    var spawnify        = require('spawnify'),
        Util            = require('util-io'),
        io              = require('socket.io'),
        
        CWD             = process.cwd(),
        
        Socket,
        
        Clients         = [],
        
        addNewLine      = function (text) {
            var newLine     = '',
                n           = text && text.length;
            
            if (n && text[n-1] !== '\n')
                newLine = '\n';
            
            return text + newLine;
        },
        
        ConNum          = 0,
        
        CHANNEL         = 'find-data';
    
    module.exports = function(options) {
        var o       = options || {},
            prefix  = o.prefix || '/find';
        
        if (o.socket)
            Socket = o.socket;
        else if (o.server)
            Socket = io.listen(o.server);
        else
            throw(Error('server or socket should be passed in options!'));
        
        Socket
            .of(prefix)
            .on('connection', function(socket) {
                onConnection(socket, o.onMsg, function(error, json) {
                    socket.emit(CHANNEL, json);
                });
            });
    };
    
    function onConnection(socket, onMsg, callback) {
        var msg, onDisconnect, onMessage;
        
        if (!callback) {
            callback    = onMsg;
            onMsg       = null;
        }
        
        Util.checkArgs([socket, callback], ['clientSocket', 'callback']);
        
        ++ConNum;
        
        if (!Clients[ConNum]) {
            msg = log(ConNum, 'find connected');
            
            if (onMsg)
                onMsg('cd .', callback);
            else
                callback(null, {
                    stdout  : addNewLine(msg),
                    path    : CWD
                });
            
            Clients[ConNum] = {
                cwd : CWD
            },
            
            onMessage                   = function(conNum, command) {
                log(conNum, command);
                
                if (onMsg)
                    onMsg(command, callback);
                else
                    spawnify(command, Clients[conNum], callback);
            }.bind(null, ConNum),
            onDisconnect                = function(conNum) {
                Clients[conNum]         = null;
                
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
    
    function log(connNum, str, typeParam) {
        var ret, 
            type       = ' ';
        
        if (str) {
            
            if (typeParam)
                type  += typeParam + ':';
            
            ret        = 'client #' + connNum + type + str;
            
            Util.log(ret);
        }
        
        return ret;
    }
})();
