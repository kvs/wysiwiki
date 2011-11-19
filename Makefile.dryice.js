#!/usr/bin/env node
//
// Concatenate and optionally minify JavaScript and CSS

var copy = require('dryice').copy;

var dst_js  = 'public/javascripts';
var dst_css = 'public/stylesheets';


/**
  * Helper functions
 **/
copy.filter.separate = function(input, source) {
    return ";\n" + input + ";\n";
};
copy.filter.separate.onRead = true;


/**
  * LABjs 
 **/
console.log('* ' + dst_js + '/LAB.min.js');
copy({
    source: 'vendor/LABjs/LAB.min.js',
    dest: dst_js + '/LAB.min.js'
});


/**
  * browser.js
 **/
console.log('* ' + dst_js + '/browser.js');

var ace_raw_js = copy.createDataObject();
var ace_min_js = copy.createDataObject();
var browser_js = copy.createDataObject();

// Build Ace-components
copy({
    source: {
        root: __dirname + '/vendor/ace/build/src/',
        include: /^(ace-uncompressed\.js|mode-.+|theme-.+)$/,
        exclude: /^mode-php\.js$/
    },
    filter: [ copy.filter.separate ],
    dest: ace_raw_js
});
copy({
    source: {
        root: __dirname + '/vendor/ace/build/src/',
        include: /^(ace\.js|mode-.+|theme-.+)$/,
        exclude: /^mode-php\.js$/
    },
    filter: [ copy.filter.separate ],
    dest: ace_min_js
});

// Build other external components
copy({
    source: ["vendor/jquery-ui-1.8.16.custom.min.js",
             "vendor/jquery.event.drag-2.0.min.js",  
             "vendor/quickdiff/quickdiff.js",
             "vendor/mdext/src/showdown.js",
             "vendor/store.js/json.js",
             "vendor/store.js/store.js"
            ],
    filter: [ copy.filter.separate ],
    dest: browser_js
});

// Build project source
copy({
    source: {
        root: 'src/js'
    },
    filter: [ copy.filter.separate ],
    dest: browser_js
});

// Build un-minified target
copy({
    source: [ ace_raw_js, browser_js ],
    dest:   dst_js + '/browser-uncompressed.js'
});

// Minify source, add to Ace-code, and build minified target
copy({
    source: browser_js,
    filter: [ copy.filter.uglifyjs ],
    dest:   ace_min_js
});
copy({
    source: ace_min_js,
    dest:   dst_js + '/browser.js'
});


/**
  * browser.css
 **/
console.log('* ' + dst_css + '/browser.css');

copy({
    source: ['src/css/browser.css',
             'src/css/universal.css',
             'src/css/ace-twilight.css',
             'src/css/sprites.css'
    ],
    filter: function (data) { return data + "\n"; },
    dest: dst_css + '/browser.css'
});
