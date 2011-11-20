#!/usr/bin/env node
/**
  * Backend server for Wysiwiki
  */

var express = require('express');
var app = express.createServer();
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');


/**
  * Configuration
 **/
app.configure(function() {
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger('dev'));
});
app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function() {
  app.use(expres.errorHandler());
});


/**
  * Return 404 for all Markdown-documents - if a document exists, it
  * is handled by the 'static' middleware.
 **/
app.get(/^\/documents\/(.+)$/, function(req, res) {
  res.send(404);
});

/**
  * Return index.html for any non-Markdown-document requests.
 **/
app.get(/^.+$/, function(req, res) {
  res.sendfile('public/index.html');
});


/**
  * Default POST request - attempts to store the document under 'public/documents/'
 **/
app.post(/^\/documents\/(.+)\.json$/, function(req, res) {
  doc = path.normalize(req.url);
  exists = path.existsSync('public/' + doc);

  mkdirp('public/' + path.dirname(doc));

  fs.writeFile('public/' + path.dirname(doc) + '/' + path.basename(doc, '.json') + '.md', req.body.text, function(err) {
    if (err) {
        res.send({status:"failure", message:"Internal error."}, 500);
      } else {
        message = (exists ? "Page updated." : "Page created.");
        res.send({status:"success",message:message}, 200);
      }
  });
});


/**
  * Start the server
 **/
if (!module.parent) {
  app.listen(8888);
  console.log("Express server listening on port %d", app.address().port);
} else {
  module.exports = app;
}
