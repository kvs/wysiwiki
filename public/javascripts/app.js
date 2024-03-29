/*jshint browser:true curly:true latedef:true noarg:true noempty:true undef:true strict:true trailing:true */
/*global define require editor MathJax */

// Load custom 'ace/requirejs/text' module, which is just the RequireJS 'text'-plugin - the
// only supplied with Ace isn't compatible with r.js
require(['ace-requirejs-text']);

define([
  'jquery',
  'libs/markdown/markdown',
  'ace/ace',
  'ace-highlight',
  'notify',
  'markdownplus',
  'store/store',
  'markdowntools',
  'quickdiff/quickdiff',
  'mathjax',
  'libs/jquery-ui/jquery-ui-1.8.16.custom',
  'libs/jquery-event-drag/jquery.event.drag-2.0',
  'libs/markdown/instiki'
], function($, Markdown, ace, Highlight, Notify, MarkdownPlusMode, store, MarkdownTools) {
  'use strict';

  // In a given context, make sure all images (skipping MathJax related images)
  // Are no wider than the page width.
  function size_image(obj) {
    setTimeout(function () {
      obj = $(obj);
      if (obj.width() > 640) {
        var scale = 640 / obj.width();
        obj.width(obj.width() * scale);
      }
    }, 0);
  }

  function size_images(context) {
    $("img", context).not(".MathJax_strut").each(function (i, obj) {
      size_image(obj);
    });
  }

  $(document).ready(function () {
    // Determine page-name
    var pagename = window.location.pathname;
    if (pagename === "/") {
      pagename = "index";
    }

    // Notification script
    var notify = new Notify.Notify($("#notify"));
    notify.onDisplay(function () {
      $(this).css({right:$("#toolpanel").width()/2 - 200});
    });

    /*jshint jquery:true browser:true curly:true latedef:true noarg:true noempty:true strict:false undef:true trailing:true */
    /*global define Showdown */

    // Check all output images once the page has loaded.
    size_images($("#output")[0]);

    // Setup a filter for comparing mathInline spans.
    $.fn.quickdiff("filter", "mathSpanInline",
      function (node) { return (node.nodeName === "SPAN" && $(node).hasClass("mathInline")); },
      function (a, b) {
        var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
        return ("%%" + aHTML + "%%") !== bHTML;
      });

    // Setup a filter for comparing math spans.
    $.fn.quickdiff("filter", "mathSpan",
      function (node) { return (node.nodeName === "SPAN" &&
                                $(node).hasClass("math")); },
      function (a, b) {
        var aHTML = $.trim($("script", a).html()), bHTML = $.trim($(b).html());
        return ("$$" + aHTML + "$$") !== bHTML;
      });
      
    // Filter for highlighted code segments;
    $.fn.quickdiff("filter", "codePre",
      function (node) { return node.nodeName === "PRE"; },
      function (a, b) {
        var aValue, bValue;
        if ($(a).data("highlighter")) {
          aValue = $.trim($(a).data("highlighter").getValue());
          
          // Hack to update mode.
          $(a).data("highlighter").setMode($("code", b).attr("class"));
        } else {
          aValue = $.trim($(a).text());
        }
        bValue = $.trim($(b).text());
        return aValue !== bValue;
      });
      
    $.fn.quickdiff("attributes", {
      "td" : ["align"],
      "th" : ["align"],
      "img" : ["src", "alt", "title"],
      "a" : ["href", "title"],
      "code" : ["class"]
    });

    // Render script
    var redrawNeeded = false, preproc, renderDelay = 0, timer;
    
    // If draw latency sufficiently small, use a small delay on rendering.
    // Otherwise use a significantly larger one.
    var setRenderDelay = function (rendertime) {
      if (rendertime > 50) {
        renderDelay = 400;
      } else if (rendertime > 10) {
        renderDelay = 50;
      }
    };

    // Redraws the output using the content of the input.
    var redraw = function () {
      if (!redrawNeeded) {
        return;
      } else {
        redrawNeeded = false;
      }

      var startTime = (new Date()).getTime();
      preproc = $("<div></div>").html(Markdown.toHTML(editor.getSession().getValue(), 'Instiki'));
      var patch = $("#output > div").quickdiff("diff", preproc, ["mathSpan", "mathSpanInline", "codePre"]);
      
      if (patch.type === "identical") {
        setRenderDelay((new Date()).getTime() - startTime);
        return;
      }
      
      if (patch.type === "replace" && patch.source.length === 1 && patch.replace.length === 1 && $(patch.replace[0]).is("pre") && $(patch.source[0]).data("highlighter")) {
        $(patch.source[0]).data("highlighter").setValue($(patch.replace[0]).text());
        setRenderDelay((new Date()).getTime() - startTime);
        return;
      }
      
      if (patch.type === "replace" && patch.source.length === 1 && patch.replace.length === 1 && $(patch.replace[0]).is("img") && $(patch.source[0]).is("img") && $(patch.replace[0]).attr("src") === $(patch.source[0]).attr("src")) {
        $(patch.source[0]).attr("title", $(patch.replace[0]).attr("title"));
        $(patch.source[0]).attr("alt", $(patch.replace[0]).attr("alt"));
        return;
      }
      
      patch.patch();
      
      if (patch.type !== "identical" && patch.replace.length > 0) {
        $.each(patch.replace, function (i, el) {
          $("pre", el).each(function (i, el) {
            new Highlight($(el));
          });
          
          if ($(el).is("pre")) {
            new Highlight($(el));
          } else if (el.innerHTML) {
            MathJax.Hub.Typeset(el, function () {
              setRenderDelay((new Date()).getTime() - startTime);
            });
            size_images(el);
          } else if (el.tagName && el.tagName.toLowerCase() === 'img') {
            size_image(el);
          } else {
            setRenderDelay((new Date()).getTime() - startTime);
          }
        });
      } else {
        setRenderDelay((new Date()).getTime() - startTime);
      }
    };
    
    window.editor = ace.edit("ace");
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setMode(new MarkdownPlusMode.Mode());
    editor.renderer.setShowGutter(false);
    editor.renderer.setHScrollBarAlwaysVisible(false);
    editor.getSession().setUseWrapMode(true);
    editor.setShowPrintMargin(false);
    editor.setBehavioursEnabled(true);
    
    var userTheme = store.get('userTheme');
    if (userTheme) {
      editor.setTheme(userTheme);
      $("#themeselect").val(userTheme);
    } else {
      editor.setTheme("ace/theme/twilight");
    }
    $("#themeselect").change(function () {
      editor.setTheme($(this).val());
      store.set("userTheme", $(this).val());
    });
    
    var userTab = store.get('userTab');
    if (userTab) {
      editor.getSession().setTabSize(parseInt(userTab, 10));
      $("#tabselect").val(userTab);
    } else {
      editor.getSession().setTabSize(4);
    }
    $("#tabselect").change(function () {
      editor.getSession().setTabSize(parseInt($(this).val(), 10));
      store.set("userTab", $(this).val());
    });
    
    $("#wrapselect").change(function () {
      editor.getSession().setUseWrapMode($(this).val() == "soft");
    });
    
    var pre_els = $("pre");
    
    pre_els.each(function (i, el) {
      new Highlight($(el));
    });
    
    var panels = {
      tool: 180,
      edit: 500
    };
    
    var editpanel = $("#editpanel"),
      toolpanel = $("#toolpanel"),
      edittools = new MarkdownTools(editor, $("#acetools"), "/images/fugue/"),
      page = $("#page"),
      content = "";
    
    function alignPage() {
      if (page.slid) {
        var leftMargin = (($(window).width()-panels.edit) - ($("#page").width() ))/2;
        if (leftMargin < 10) {
          leftMargin = 10;
        }

        page.stop()
          .css({marginLeft: $("#page").offset().left})
          .animate({marginLeft:leftMargin});
      } else {
        page.css({margin:"30px auto"});
      }
    }
    
    function setWidths(i) {
      $("#toolpanel, #editpanel").width(panels[i]);
      alignPage();
      editor.resize();
    }
    
    $(window).resize(alignPage);
    
    editpanel.slide = function (show, preview) {
      if (!preview) {
        notify.conceal();
      }
    
      if (editpanel.slid === show) {
        return;
      }
      
      if (show) {
        editpanel
          .css({width: panels.edit, marginRight: -panels.edit})
          .animate({marginRight:0});
        editor.resize();
      } else {
        editpanel.animate({marginRight:-panels.edit});
      }
      editpanel.slid = show;
    };
    
    toolpanel.slide = function (show) {
      if (toolpanel.slid === show) {
        return;
      }
      
      if (show) {
        toolpanel
          .css({right: 20, width: panels.tool})
          .animate({width: panels.edit, right: 0}, function () {
            toolpanel.toggleClass("edit", true);
            toolpanel.toggleClass("readonly", false);
          });
      } else {
        toolpanel
          .css({right: 0, width: panels.edit})
          .animate({width: panels.tool, right: 20});
        toolpanel.toggleClass("edit", false);
        toolpanel.toggleClass("readonly", true);
      }
      toolpanel.slid = show;
    };
      
    page.slide = function (show) {
      if (page.slid === show) {
        return;
      }
      page.slid = show;
      
      if (show) {
        alignPage();
      } else {
        page
          .animate({marginLeft: ($(window).width()-$("#page").width())/2},
            function () {
              page.css({margin:"30px auto"});
            });
      }
    };
    
    var previewing = false, modified = false, origcontent;

    function refreshModified() {
      redrawNeeded = true;
      modified = editor.getSession().getValue() !== content;
      $("#save").css({opacity:modified ? 1 : 0.5});
      
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(redraw, renderDelay);
    }
    
    // Toggle editing
    var toggleEditOn = function () {
      editpanel.slide(true);
      toolpanel.slide(true);
      page.slide(true);
      editor.focus();
      return false;
    };
    
    $("#edit").click(toggleEditOn);
      
    var doCancel = function () {
      editpanel.slide(false);
      toolpanel.slide(false);
      page.slide(false);
      previewing = false;
      modified = false;
      var y = editor.renderer.getScrollTop();
      editor.getSession().setValue(content);
      editor.renderer.scrollToY(y);
      refreshModified();
    };

    var doSave = function () {
      var cont = editor.getSession().getValue();
      var payload = {text: cont};
      $.post("/documents/" + pagename + ".json", payload, function (ret) {
        if (ret && ret.status === "success") {
          content = cont;
          notify.showMessage("Saved.", "success");
          refreshModified();
        } else {
          if (ret && ret.status === "failure") {
            notify.showMessage(ret.message, "warning");
          } else {
            notify.showMessage("Unknown response from the server.", "warning");
          }
        }
      }, "json");
      
      return false;
    };

    $("#cancel").click(function () {
      if (!modified) {
        doCancel();
      } else {
        notify.showConfirm("Closing editor will lose unsaved changes.", doCancel);
      }
      return false;
    });
    $("#save").click(function () {
      refreshModified();
      if (!modified) {
        return false;
      }

      notify.showConfirm("Saving.", doSave);

      return false;
    });

    $("#dragger").drag("start", function (ev, dd) {
      $.data(this, 'startw', editpanel.width());
    }).drag(function(ev, dd) {
      panels.edit = $.data(this, 'startw') - dd.deltaX;
      setWidths("edit");
    });
    
    $("#preview").click(function () {
      page.slide(previewing);
      editpanel.slide(previewing, true);
      previewing = !previewing;
      return false;
    });

    // Set editor content, and force a re-render
    function setContent(c) {
      content = c;
      editor.getSession().setValue(content);
      editor.renderer.scrollToY(0);
    }

    editor.getSession().on('change', refreshModified);

    // Attempt to load Markdown-page
    $.get("/documents/" + pagename + ".md", function (data) {
      setContent(data);
    }).error(function(xhr) {
      if (xhr.status == 404) {
        setContent("# New page");
      } else {
        setContent("# Error\n");
      }
    });
    
    return false;
  });
});
