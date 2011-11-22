/*jshint jquery:true browser:true curly:true latedef:true noarg:true noempty:true undef:true strict:true trailing:true */
/*global define */

define('ace/mode/markdownplus', function (require, exports, module) {
"use strict";

var oop = require("ace/lib/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var MarkdownPlusHighlightRules = require("ace/mode/markdownplus_highlight_rules").MarkdownPlusHighlightRules;
var Range = require("ace/range").Range;

var Mode = function() {
    var modes = {};

    // Attempt to load all modes defined under 'ace/mode/'
    for (var mod in define.modules) {
        if (mod.match(/^ace\/mode\/(.+)/)) {
            var mode = require(mod).Mode;
            if (mode !== undefined && mod !== "ace/mode/markdownplus") {
                modes[mod + "-"] = mode;
            }
        }
    }

    var highlighter = new MarkdownPlusHighlightRules();
    this.$tokenizer = new Tokenizer(highlighter.getRules());
    this.$embeds = highlighter.getEmbeds();
    this.createModeDelegates(modes);
};
oop.inherits(Mode, TextMode);

(function() {
    this.getNextLineIndent = function(state, line, tab) {
        if (state == "listblock") {
            var match = /^((?:.+)?)([\-+*][ ]+)/.exec(line);
            if (match) {
                return new Array(match[1].length + 1).join(" ") + match[2];
            } else {
                return "";
            }
        } else {
            return this.$getIndent(line);
        }
    };
}).call(Mode.prototype);

exports.Mode = Mode;
});
