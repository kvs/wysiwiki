#!/usr/bin/env node

/**
  * Backend server for Wysiwiki
  */

var express = require('express')
  , app = express.createServer();

app.configure(function() {
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function() {
  app.use(expres.errorHandler());
});

// // Middleware for processing page id and extension

// function prePage(req, res, next) {
//   req.params.id = req.params[0];
//   if (req.params[1] !== undefined) {
//     req.params.extn = req.params[1];
//   } else {
//     req.params.extn = "html";
//   }
//   next();
// }

// All GET requests return index.html
app.get(/^.+$/, function(req, res) {
  res.sendfile('public/index.html');
});

app.post(/^.+$/, function(req, res) {
  console.log("Test");
});
// app.post(/^\/([a-zA-Z0-9_-]{2,})\.?(json)?$/, prePage, express.bodyParser(), function(req, res, next) {
//   PageModel.findOne({iden: req.params.id}, function (err, post) {
//     if (err) {
//       res.send({status:"failure", message:"Internal error."}, 500);
//       return;
//     } else if (post) {  
//       if ((req.body.password || (post.hash !== "false")) && (post.hash !== req.body.password)) {
//         res.send({status:"failure",message:"Invalid password."}, 403);
//       } else {
//         post.text = req.body.text;
//         post.save(function(err) {
//           if (!err) res.send({status:"success",message:"Page updated."}, 200);
//           // redis_client.del("page_" + post.iden);
//         });
//       }
//     } else {
//       post = new PageModel();
//       post.iden = req.params.id;
//       post.text = req.body.text;
//       if (req.body.password) {
//         post.hash = req.body.password;
//       } else {
//         post.hash = false;
//       }
//       post.save(function (err) {
//         if (!err) res.send({status:"success",message:"Page created."}, 200);
//       });
//     }
//   });
// });

// app.get(/^\/([a-zA-Z0-9_-]{2,})\.?(json)?$/, [prePage], function(req, res, next) {
//   var page = {
//     pagename: req.params.id
//   }
  
//   PageModel.findOne({iden: req.params.id}, function (err, post) {
//     if (err) {
//       res.send("Something went wrong.", 500);
//       return;
//     }
    
//     if (post && post.hash !== "false") {
//       page.passreq = "true";
//     } else {
//       page.passreq = "false";
//     }
    
//     if (!err && post) {
//       if (req.params.extn === "json") {
//         res.send({text:post.text});
//         return;
//       } else {
//         page.editing = "false";
//         page.content = markdown.makeHtml(post.text);
// //        redis_client.hmset("page_" + page.pagename, page);
//       }
//     } else {
//       page.editing = "true";
//       page.content = "";
//     }
    
//     if (false && req.headers["user-agent"] && isMobileBrowser(req.headers["user-agent"])) {
//       res.render('mobile', { page: page });
//     } else {
//       res.render('page', { page: page });
//     }
//   });
// });

// Start the server

if (!module.parent) {
  app.listen(8888);
  console.log("Express server listening on port %d", app.address().port);
} else {
  module.exports = app;
}
