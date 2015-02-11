var io;

(function(window) {
    'use strict';
    
    window.webfind = new FindProto();
    
    function FindProto() {
        var elementSearch,
            elementClear,
            elementName,
            elementDir,
            elementResult,
            elementLoad,
            
            TMPL_MAIN,
            TMPL_FILE,
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
            
            load(prefix, function(error, templates) {
                parseTemplates(templates);
                createElements(el);
                addListeners(prefix);
                
                if (typeof callback === 'function')
                    callback();
            });
            
            return Find;
        }
        
        Find.setDir    = function(dir) {
            if (elementDir)
                elementDir.value = dir;
            
            return Find;
        };
        
        Find.setName   = function(name) {
            if (elementName)
                elementName.value = name;
            
            return Find;
        };
        
        function load(prefix, callback) {
            var scripts = [];
            
            if (!window.load)
                scripts.push(prefix + '/assets/modules/load/load.js');
            
            if (!window.join)
                scripts.push(prefix + '/join/join.js');
            
            if (!window.rendy)
                scripts.push(prefix + '/assets/modules/rendy/lib/rendy.js');
            
            if (!scripts.length)
                after(prefix, callback);
            else
                loadScript(scripts, function() {
                    after(prefix, callback);
                });
        }
        
        function after(prefix, callback) {
            var load    = window.load,
                join    = window.join,
                
                css     = prefix + join([
                    '/assets/css/style.css',
                    '/assets/css/webfind.css'
                ]),
                
                loadTemplates = function() {
                    var path        = '/template/',
                        pathTmpl    = prefix + join([
                            path + 'main.html',
                            path + 'file.html',
                        ]);
                    
                    load(pathTmpl, callback);
                };
            
            load.json(prefix + '/modules.json', function(error, remote) {
                if (error)
                    console.log(error);
                else
                    load.series(remote.concat(css), loadTemplates);
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
            var href            = getHost(),
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
        
        function getHost() {
            var l       = location,
                href    = l.origin || l.protocol + '//' + l.host;
            
            return href;
        }
        
        function createElements(element) {
            var submit          = function() {
                var name    = elementName.value,
                    dir     = elementDir.value;
                
                if (!name)
                    name = elementName.value = '*';
                
                if (!dir)
                    dir = elementDir.value = '/';
                
                if (elementSearch.textContent === 'Stop') {
                    elementSearch.textContent = 'Start';
                    elementClear.disabled = false;
                    
                    socket.emit(CHANNEL, {
                        stop: true
                    });
                    
                    hideLoad();
                } else {
                    elementResult.textContent = '';
                    elementSearch.textContent = 'Stop';
                    elementClear.disabled = true;
                    
                    socket.emit(CHANNEL, {
                        name: name,
                        dir: dir
                    });
                    
                    showLoad();
                }
            },
            
            onEnter         = function(event) {
                var ENTER = 13;
                
                if (event.keyCode === ENTER)
                    submit();
            };
            
            element.innerHTML = TMPL_MAIN;
                
            elementSearch   = element.querySelector('[data-name="webfind-button-search"]');
            elementClear    = element.querySelector('[data-name="webfind-button-clear"]');
            elementName     = element.querySelector('[data-name="webfind-name"]');
            elementDir      = element.querySelector('[data-name="webfind-dir"]');
            elementResult   = element.querySelector('[data-name="webfind-result"]');
            elementLoad     = element.querySelector('[data-name="webfind-load"]');
            
            elementLoad.classList.add('webfind-load-' + (isSVG() ? 'svg' : 'gif'));
            
            elementSearch.addEventListener('click', submit);
            elementName.addEventListener('keydown', onEnter);
            elementDir.addEventListener('keydown', onEnter);
            
            elementClear.addEventListener('click', function() {
                elementResult.textContent = '';
            });
        }
        
        /**
         * check SVG SMIL animation support
         */
        function isSVG() {
            var ret, svgNode, name,
                create  = document.createElementNS,
                SVG_URL = 'http://www.w3.org/2000/svg';
            
            if (create) {
                create  = create.bind(document);
                svgNode = create(SVG_URL, 'animate');
                name    = svgNode.toString();
                ret     = /SVGAnimate/.test(name);
            }
            
            return ret;
        }
        
        function hideLoad() {
            elementLoad.classList.add('webfind-hide');
        }
        
        function showLoad() {
            elementLoad.classList.remove('webfind-hide');
        }
        
        function parseTemplates(templates) {
            var elMain, elFile,
                el          = document.createElement('div');
            el.innerHTML    = templates;
            
            elMain      = el.querySelector('[data-name="webfind-template-main"]');
            elFile      = el.querySelector('[data-name="webfind-template-file"]');
            
            TMPL_MAIN   = elMain.innerHTML;
            TMPL_FILE   = elFile.innerHTML;
        }
        
        function onMessage(data) {
            var el;
            
            if (data.error)
                console.log(data.error);
            else if (data.path) {
                el = document.createElement('li');
                
                el.innerHTML = rendy(TMPL_FILE, {
                    name: data.path,
                    type: data.type
                });
                
                el.setAttribute('data-name', 'js-' + data.path);
                
                elementResult.appendChild(el);
            } else if (data.done) {
                if (!elementResult.childNodes.length)
                    elementResult.textContent = 'File not found.';
                
                elementSearch.textContent = 'Start';
                hideLoad();
            }
        }
        
        return Find;
    }
    
})(this);
