var io;

(function(window) {
    'use strict';
    
    window.webfind = new FindProto();
    
    function FindProto() {
        var CHANNEL = 'find-data',
            socket;
        
        function Find(element, prefix, callback) {
            var el,
                type        = typeof element,
                isString    = type === 'string';
            
            if (!callback) {
                callback    = prefix;
                prefix      = '/webfind';
            }
            
            if (isString)
                el  = document.querySelector(element);
            else
                el  = element;
            
            load(prefix, function() {
                addListeners(prefix);
                
                if (typeof callback === 'function')
                    callback();
            });
            
            return find.bind(null, prefix);
        }
        
        function find(prefix, name, dir) {
            socket.emit(CHANNEL, dir + ':' + name);
        }
        
        function load(prefix, callback) {
            loadScript([prefix + '/assets/js/load.js', prefix + '/join/join.js'], function() {
                var load    = window.load,
                    join    = window.join,
                    
                    css     = prefix + join([
                        '/css/style.css',
                    ]);
                
                load.json(prefix + '/modules.json', function(error, remote) {
                    if (error)
                        console.log(error);
                    else
                        load.series(remote.concat(css), callback);
                });
            });
        }
        
        function loadScript(srcs, callback) {
            var i       = srcs.length,
                func    = function() {
                    --i;
                    
                    if (!i)
                        callback();
                };
            
            srcs.forEach(function(src) {
                var element = document.createElement('script');
                
                element.src = src;
                element.addEventListener('load', func);
                
                document.body.appendChild(element);
            });
        }
        
        function addListeners(room) {
            var href            = location.origin,
                FIVE_SECONDS    = 5000;
                
            socket = io.connect(href + room, {
                'max reconnection attempts' : Math.pow(2, 32),
                'reconnection limit'        : FIVE_SECONDS
            });
            
            socket.on(CHANNEL, function(data) {
                console.log(data)
            });
            
            socket.on('connect', function() {
                console.log('webfind: connected\n');
            });
            
            socket.on('disconnect', function() {
                console.log('webfind: disconnected\n');
            });
        }

        return Find;
    }
    
})(this);
