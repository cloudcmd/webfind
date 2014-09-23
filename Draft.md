WebFind
=======

Web find used in [Cloud Commander](http://cloudcmd.io).

## Install

`npm i webfind -g`

## Use as standalone

Start `webfind`, go to url `http://localhost:1337`

## API

### Client API

**webfind(element [, prefix], callback)**

- element   - html element, or selector
- prefix    - (optional) prefix to url (same as in server)
- callback  - function to call after init

When prefix set in server and client, you should use same prefix in html.
For example, if you use prefix "any_prefix" you should connect
webfind script in this way:

`<script src="/webfind/webfind.js"></script>`


### Server API

**webfind(options);**

Could be used as middleware, or for init `WebFind`.

```js
webfind({
    server: server,/* only one should be passed: */
    socket: socket,/* server or socket  */
    online: true, /* default */
    minify: true, /* default */
    prefix:'/webfind' /* default */
})
```

**webfind.middle(options);**

Middleware function if there is a need of init `socket` in another place.

```js
webfind.middle({
    prefix: '/webfind', /* default */
    online: true, /* default */
    minify: true, /* default */
})
```

## Use as middleware

To use `WebFind` in your programs you should make local install:

`npm i webfind express --save`

And use it in your program

```js
/* server.js */

var webfind     = require('webfind'),
    http        = require('http'),
    express     = require('express'),
    
    app         = express(),
    server      = http.createServer(app),
    
    port        = 1337,
    ip          = '0.0.0.0';
    
app .use(webfind({
        server: server,
        online: true /* load jquery and socket.io from cdn */
    }))
    .use(express.static(__dirname));

server.listen(port, ip);
```

```html
<!-- index.html -->

<div class="webfind"></div>
<script src="/webfind/webfind.js"></script>
<script>
    (function() {
        'use strict';
        
        window.addEventListener('load', load);
        
        function load() {
            window.removeEventListener('load', load);
            
            webfind('.webfind', function() {
                console.log('webfind ready')
            });
        }
    })()
</script>
```

## License

MIT