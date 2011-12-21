/*jshint browser:true curly:true latedef:true noarg:true noempty:true undef:true strict:true trailing:true */
/*global define */
/*
 * Wrap an element with a text-only Ace editor, and set syntax highlighting mode.
 */
define(['require', 'jquery', 'ace/edit_session', 'ace/layer/text', 'ace/theme/solarized_dark'], function (require, $, EditSession, TextLayer, Theme) {
"use strict";

// Add a removal event
(function () {
  var ev = new $.Event('remove'),
    orig = $.fn.remove;
  $.fn.remove = function () {
    $(this).trigger(ev);
    return orig.apply(this, arguments);
  };
})();

function Highlight(element) {
  if (/(a)|(b)/.exec("b")[1] !== undefined) {
    return;
  }
  
  this.element = $(element);
  this.session = new EditSession.EditSession("");
  this.session.setUseWorker(false);
  this.session.setValue(this.element.text());
  this.session.setUseWrapMode(true);
  
  this.width = this.element.width();
  
  this.highlightDiv = $("<div>")
    .addClass("acecode ace_editor " + this.highlightTheme.cssClass)
    .css({ position: "static" });
    
  this.element.append(this.highlightDiv);
  $("code", this.element).hide();
  
  this.textlayer = new TextLayer.Text(this.highlightDiv.get(0));
  this.textlayer.setSession(this.session);
  $(this.textlayer.element).addClass("ace_scroller").css({
    width: this.width
  });
  
  this.setMode($(this.element, "code").attr("class"));
  this.session.adjustWrapLimit(Math.floor(this.width / this.textlayer.getCharacterWidth()));
  
  this.update();
  
  var self = this;
  this.element.bind("remove", function () {
    self.textlayer.destroy();
  });
  
  this.element.data("highlighter", this);
}

(function () {
  this.highlightTheme = Theme;
  
  this.setMode = function(mode_string) {
    if (mode_string === this.mode_string) {
      return;
    }
    
    this.mode_string = mode_string;

    require(['ace/mode/' + mode_string], function(Mode) {
      if (Mode === null) {
        this.setMode('text');
      } else {
        this.mode = new Mode.Mode();
        this.session.setMode(this.mode);
        this.update();
      }
    });
  };
  
  this.setValue = function(newcontent) {
    this.session.setValue(newcontent);
    this.update();
  };
  
  this.getValue = function () {
    return this.session.getValue();
  };
  
  this.rowCount = function() {
    var total = 0;
    for (var i = 0; i < this.session.getLength(); i++) {
      total += this.session.getRowLength(i);
    }
    return total;
  };
  
  this.update = function() {
    var lineHeight = this.textlayer.getLineHeight();
    var numRows = this.rowCount();
    if ( this.session.doc.getLine(numRows - 1) === "" ) {
      numRows -= 1;
    }
    var height = numRows * lineHeight;
    this.textlayer.update({
      firstRow: 0,
      lastRow: this.session.getLength(),
      lineHeight: lineHeight,
      width: this.width
    });
    
    this.highlightDiv.css({height: height});
    $(this.textlayer.element).css({height: height});
  };
  
}).call(Highlight.prototype);

return Highlight;
});