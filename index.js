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
