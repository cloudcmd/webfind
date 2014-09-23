var io;

(function(window) {
    'use strict';
    
    window.webfind = new FindProto();
    
    function FindProto() {
        var elementButton,
            elementName,
            elementDir,
            elementResult,
            CHANNEL         = 'find-data',
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
                createElements(el);
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
                        '/assets/css/style.css',
                        '/assets/css/webfind.css'
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
            
            socket.on(CHANNEL, onMessage);
            
            socket.on('connect', function() {
                console.log('webfind: connected\n');
            });
            
            socket.on('disconnect', function() {
                console.log('webfind: disconnected\n');
            });
        }
        
        function createElements(element) {
            var html    = '<input data-name="webfind-name" placeholder="Name" autofocus>'       +
                          '<input data-name="webfind-dir" placeholder="Directory">'   +
                          '<button data-name="webfind-button">Search</button>'        +
                          '<ul data-name="webfind-result" class="webfind-result"></ul>',
                
                submit          = function() {
                    var name    = elementName.value,
                        dir     = elementDir.value;
                    
                    if (elementButton.textContent === 'Stop') {
                        elementButton.textContent = 'Start';
                        
                        socket.emit(CHANNEL, {
                            stop: true
                        });
                    } else {
                        elementResult.textContent = '';
                        elementButton.textContent = 'Stop';
                        
                        socket.emit(CHANNEL, {
                            name: name,
                            dir: dir
                        });
                    }
                },
                
                onEnter         = function(event) {
                    var ENTER = 13;
                    
                    if (event.keyCode === ENTER)
                        submit();
                };
            
            element.innerHTML = html;
                
            elementButton   = element.querySelector('[data-name="webfind-button"]');
            elementName     = element.querySelector('[data-name="webfind-name"]');
            elementDir      = element.querySelector('[data-name="webfind-dir"]');
            elementResult   = element.querySelector('[data-name="webfind-result"]');
            
            elementButton.addEventListener('click', submit);
            elementName.addEventListener('keydown', onEnter);
            elementDir.addEventListener('keydown', onEnter);
        }
        
        function onMessage(data) {
            var el;
            
            if (data.error)
                console.log(data.error);
            else if (data.path) {
                el = document.createElement('li');
                el.textContent = data.path;
                elementResult.appendChild(el);
            } else if (data.done) {
                if (!elementResult.childNodes.length)
                    elementResult.textContent = 'File not found.';
                
                elementButton.textContent = 'Start';
            }
        }
        
        return Find;
    }
    
})(this);
