/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function() {
  var express = require('express');
  var router = express.Router();

  var mongo = require('mongodb');
  var ObjectID = require('mongodb').ObjectID;

  var Server = mongo.Server,
      Db = mongo.Db,
      BSON = mongo.BSONPure;

  var libbuild      = require('./libbuild');
  var libmeta       = require('../application/libmeta');
  var libuser       = require('../users/libusersapi');
  var libappbundles = require('../application/libappbundles');

  var formidable = require('formidable');
  var fs = require('fs');
  var jsonfile = require('jsonfile');
  var mkdirp = require('mkdirp');
  var async = require('async');
  var spawn = require('child_process').spawn;


  router.post('/', function(req, res) {
    console.log('post to /build called');
    console.log('req: ' + JSON.stringify());
    var item = req.body;

    try {
      libbuild.build(item, 'default', function(results) {
        var r = JSON.parse(results);
        if(r.result == 'failed') {
          res.send('{"result":"success"}');
          return;
        }
        var rm_bundle = spawn('rm',
                             ['-rf', r.output.replace('/../default.apps', '')],
                             {});
        rm_bundle.stdout.on('data', (data) => {
          console.log('stdout: ${data}');
        });

        rm_bundle.stderr.on('data', (data) => {
          console.log('stderr: ${data}');
        });

        rm_bundle.on('close', (code) => {
          res.send('{"result":"success"}');
        });
      });
    }
    catch (e) {
      console.log(e);
      throw(e);
    }

  });

  router.put('/option',  function(req, res) {
    console.log('post to /build/option called');
    console.log('req.body.option: ' + JSON.stringify(req.body.option));
    console.log('req.body.user: ' + JSON.stringify(req.body.user));

    if (req.body.user == undefined || req.body.user.length == 0) {
      // Save option to appbundle
      libappbundles.getAppByQuery({app_key:req.body.appkey}, function(items) {
        if (items == 0) {
          res.send('{"result":"Error : No items"}');
        } else {
          console.log(items);
          items[0].metaHistory.push(req.body.option);
          libappbundles.updateapis(items[0], function(results) {
            res.send('{"result":"success"}');
          });
        }
      });
    } else {
      // Query User
      // Add option to metaHistory
      // Update user
      console.log("Save option to each user");
      var users = req.body.user;
      var option = req.body.option;
      async.eachSeries(users, function(user, callNextLoop) {
        if (user.metaHistory == undefined) {
          console.log("metaHistory is undefined");
          user.metaHistory = [];
        }
        user.metaHistory.push(option);
        libuser.update(user, function(results) {
          callNextLoop();
        });
      }, function(err) {
        if (err) {
          res.send('{"result":"Fail??"}');
        } else {
          res.send('{"result":"success"}');
        }
      });
    }
  });

  router.post('/build',  function(req, res) {
    console.log('post to /build/build called');
    console.log('req.body.app: ' + JSON.stringify(req.body.app));
    console.log('req.body.user: ' + JSON.stringify(req.body.user));
    console.log('req.body.option: ' + JSON.stringify(req.body.option));
    console.log('req.body.tag: ' + JSON.stringify(req.body.tag));
    console.log('req.body.comment: ' + JSON.stringify(req.body.comment));
    console.log('req.body.targetgroup: ' + JSON.stringify(req.body.targetgroup));
    var item = req.body.app;

    try {
      var timestamp = new Date().valueOf();
      libbuild.composenbuild(req.body.option, item, timestamp, function(results) {
        var r = JSON.parse(results);
        console.log('filename: ' + r.output);
        
        if(r.result == 'failed') {
          res.send('{"result":"failed"}');
          return;
        }

        // option들과 결과 파일을 사용자 파일에 넣어두자
        //res.send(results);
        //fs.readFile(timestamp+'.apps', function(err, data) {
        //Users/yop/p/z/grandyakurt/server_context/sc_backend/routes/build/../../sc_apps/sc/app_list_key/1.0/ios
        console.log('// Build results ///////////////////////////////////////////');
        console.log(results);
        console.log('\r\n');

        console.log('JSON.stringify(req.body.option) : ' + JSON.stringify(req.body.option));
        for(var i in req.body.app.metaHistory) {
          var m = req.body.app.metaHistory[i].meta;
          console.log('JSON.stringify(m) : ' + JSON.stringify(m));
          
          if(JSON.stringify(req.body.option) == JSON.stringify(JSON.parse(m))) {
            console.log("  found updatable meta info");
            req.body.app.metaHistory[i].timestamp   = timestamp;
            //req.body.app.metaHistory[i].targetgroup = req.body.targetgroup;
            //req.body.app.metaHistory[i].tag         = req.body.tag;
            //req.body.app.metaHistory[i].comment     = req.body.comment;
            req.body.app.metaHistory[i].outputpath  = r.output.replace('/build_'+timestamp + '/..', '');
            break;
          }
          else {
            console.log("  failed to find updatable meta info");
          }
        }

        var v = {};
        v.app_name        = req.body.app.app_name;
        v.app_key         = req.body.app.app_key;
        v.app_secret      = req.body.app.app_secret;
        v.app_version     = req.body.app.app_version;
        v.os              = req.body.app.os;
        v.developer       = req.body.app.developer;
        v.abs_path        = req.body.app.abs_path;
        v.meta            = req.body.option;
        v.meta_name       = req.body.meta_name;
        v.meta_targetuser = req.body.targetgroup;
        v.tag             = req.body.tag;
        v.comment         = req.body.comment;
        v.timestamp       = timestamp;
        var strOutput = r.output.replace('/build_'+timestamp + '/..', '');
        var indexOfPath = strOutput.indexOf('/sc_apps/');
        
        v.outputpath      = strOutput.substring(indexOfPath);

        libmeta.addapis(v, function(results) {

          var build_dir = r.output.replace('/../'+timestamp+'.apps.gz', '');
          console.log('build_dir to be deleted: ' + build_dir);

          var rm_bundle = spawn('rm',
                               ['-rf', build_dir],
                               {});
          rm_bundle.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          rm_bundle.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });

          rm_bundle.on('close', (code) => {
            console.log('removed build environment.')
            res.send('{"result":"success"}');
          });
        });
      });
    }
    catch (e) {
      console.log(e);
      res.send('{"result":"fail"}');
      throw(e);
    }

  });

  module.exports = router;
})();
