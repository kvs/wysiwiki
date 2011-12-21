/*jshint jquery:true browser:true curly:true latedef:true noarg:true noempty:true undef:true strict:true trailing:true */
/*global define */

define(function (require, exports, module) {
"use strict";

var oop = require("ace/lib/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var MarkdownPlusHighlightRules = function() {
    // Create embedding-rules for github-style blocks.
    var rules = [];
    var embeds = {};

    for (var mod in define.modules) {
        var match = mod.match(/^ace\/mode\/(.+)_highlight_rules/);
        if (match !== null && match[1] !== "markdownplus") {
            var tag = match[1];
            var rule = require(mod);
            var exports = [], x;
            for (x in rule) {
                exports.push(x);
            }

            if (exports.length === 1) {
                rules.push({
                    token: "support.function",
                    regex: "^```" + tag + "\\s*$",
                    next:  tag + "-start"
                });
                embeds[tag] = rule[exports[0]];
            }
        }
    }

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used
    this.$rules = {
        "start" : [ {
            token : "empty_line",
            regex : '^$'
        }, { // code span `
            token : "support.function",
            regex : "(`+)([^\\r]*?[^`])(\\1)"
        }, { // code block
            token : "support.function",
            regex : "^[ ]{4}.+"
        }, { // h1
            token: "markup.heading.1",
            regex: "^=+(?=\\s*$)"
        }, { // h2
            token: "markup.heading.1",
            regex: "^\\-+(?=\\s*$)"
        }, { // header
            token : function(value) {
                return "markup.heading." + value.length;
            },
            regex : "^#{1,6}"
        }].concat(rules).concat([
        { // Catch-all for github-style blocks
            token : "support.function",
            regex : "^```[a-zA-Z]+\\s*$",
            next  : "githubblock"
        }, { // block quote
            token : "string",
            regex : "^>[ ].+$",
            next  : "blockquote"
        }, { // reference
            token : ["text", "constant", "text", "url", "string", "text"],
            regex : "^([ ]{0,3}\\[)([^\\]]+)(\\]:\\s*)([^ ]+)(\\s*(?:[\"][^\"]+[\"])?\\s*)$"
        }, { // link by reference
            token : ["text", "string", "text", "constant", "text"],
            regex : "(\\[)((?:[[^\\]]*\\]|[^\\[\\]])*)(\\][ ]?(?:\\n[ ]*)?\\[)(.*?)(\\])"
        }, { // link by url
            token : ["text", "string", "text", "markup.underline", "string", "text"],
            regex : "(\\[)"+
                    "(\\[[^\\]]*\\]|[^\\[\\]]*)"+
                    "(\\]\\([ \\t]*)"+
                    "(<?(?:(?:[^\\(]*?\\([^\\)]*?\\)\\S*?)|(?:.*?))>?)"+
                    "((?:[ \t]*\"(?:.*?)\"[ \\t]*)?)"+
                    "(\\))"
        }, { // HR *
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\*[ ]?){3,}\\s*$"
        }, { // HR -
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\-[ ]?){3,}\\s*$"
        }, { // HR _
            token : "constant",
            regex : "^[ ]{0,2}(?:[ ]?\\_[ ]?){3,}\\s*$"
        }, { // list
            token : "markup.list",
            regex : "^\\s{0,3}(?:[*+-]|\\d+\\.)\\s+",
            next  : "listblock"
        }, { // strong ** __
            token : "string",
            regex : "([*]{2}|[_]{2}(?=\\S))([^\\r]*?\\S[*_]*)(\\1)"
        }, { // emphasis * _
            token : "string",
            regex : "([*]|[_](?=\\S))([^\\r]*?\\S[*_]*)(\\1)"
        }, { //
            token : ["text", "url", "text"],
            regex : "(<)("+
                      "(?:https?|ftp|dict):[^'\">\\s]+"+
                      "|"+
                      "(?:mailto:)?[-.\\w]+\\@[-a-z0-9]+(?:\\.[-a-z0-9]+)*\\.[a-z]+"+
                    ")(>)"
        }, {
            token : "text",
            regex : "[^\\*_%$`\\[#<>]+"
        } ]),
        
        "listblock" : [ { // Lists only escape on completely blank lines.
            token : "empty_line",
            regex : "^$",
            next  : "start"
        }, {
            token : "markup.list",
            regex : ".+"
        } ],
        
        "blockquote" : [ { // BLockquotes only escape on blank lines.
            token : "empty_line",
            regex : "^\\s*$",
            next  : "start"
        }, {
            token : "string",
            regex : ".+"
        } ],
        
        "githubblock" : [ {
            token : "support.function",
            regex : "^```",
            next  : "start"
        }, {
            token : "support.function",
            regex : ".+"
        } ]
    };

    for (var embed in embeds) {
        var rule_ = embeds[embed];
        this.embedRules(rule_, embed + '-', [{
            token : "support.function",
            regex : "^```",
            next  : "start"
        }]);
    }
};
oop.inherits(MarkdownPlusHighlightRules, TextHighlightRules);

exports.MarkdownPlusHighlightRules = MarkdownPlusHighlightRules;
});