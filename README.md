# deps-sort-integer-index-problem
`deps-sort` use increasing integer index, which may change every time the deps map changes

This happens when browserify works together with [factor-bundle](https://www.npmjs.com/package/factor-bundle).

This repo will give an example.

## Example

* `a.js` depends upon `base.js`
* we use `factor-bundle` to build two bundles, and only `base.js` will go to `common.js` (built from `b.bundle()` stream)
* after bundle, we can see that `base.js` gets id `2`, and `a.js` `1`
* if we `require('b.js')` in `a.js` (like `a.modified.js`), though `b.js` will be kept out of `common.js`, `base.js` now gets id `3`. That means we have changed the contents of `common.js` and the browser cache will be invalidated.

Here is the script:

```javascript
var browserify = require('browserify');
var factor = require('factor-bundle');
var path = require('path');
var merge = require('merge-stream');
var fs = require('fs');
var sink = require('sink-transform');

var file = path.join(__dirname, process.argv[2]);
var b = browserify(file);

var a = wrap(file);

b.plugin(factor, {
    entries: file,
    outputs: a,
    threshold: function (row, groups) {
        return path.basename(row.file) === 'base.js';
    }
});

merge([a, wrap(b.bundle())]).pipe(process.stdout);

function wrap(s) {
    var tr = sink.str(function (body, done) {
        this.push([
            '',
            '='.repeat(80),
            typeof s === 'string' && s || 'common',
            '-'.repeat(80),
            body,
            ''
        ].join('\n'))
        done();
    });

    if (typeof s === 'string') {
        return tr;
    }
    return s.pipe(tr);
}
```

`a.js`:

```javascript
var c = require('./base.js');

module.exports = 'a';
```

`a.modified.js`:

```javascript
var c = require('./base.js');
var b = require('./b.js');

module.exports = 'a';
```

`b.js`:

```javascript
module.exports = 'b';
```

`base.js`:

```javascript
module.exports = 'common';
```


### built from `a.js`

```
⌘ node index.js a.js

================================================================================
/Users/zoubin/usr/src/zoubin/deps-sort-integer-index-problem/a.js
--------------------------------------------------------------------------------
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var c = require('./base.js');

module.exports = 'a';

},{"./base.js":2}]},{},[1]);


================================================================================
common
--------------------------------------------------------------------------------
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({2:[function(require,module,exports){
module.exports = 'common';

},{}]},{},[]);
```

### built from `a.modified.js`
The contents of `common` module has changed due to the changed id (from `2` to `3`)!

```
⌘ node index.js a.modified.js

================================================================================
/Users/zoubin/usr/src/zoubin/deps-sort-integer-index-problem/a.modified.js
--------------------------------------------------------------------------------
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var c = require('./base.js');
var b = require('./b.js');

module.exports = 'a';

},{"./b.js":2,"./base.js":3}],2:[function(require,module,exports){
module.exports = 'b';

},{}]},{},[1]);


================================================================================
common
--------------------------------------------------------------------------------
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({3:[function(require,module,exports){
module.exports = 'common';

},{}]},{},[]);
```

