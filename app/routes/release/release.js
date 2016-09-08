/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'

var uuid = require('node-uuid');
var async = require('async');

var util_github  = require('./util_github');
var libbuild     = require('./libbuild');
var util_findapp = require('./util_findapp');
var publishSchema = require('../../models/Publish');
var appSchema = require('../../models/App');

var release_status = require('../../util/release_status');
var responseGenerator = require('../../util/responseGenerator');
var _this = this;

var updateReleaseStatus = function(aItem, aStatus) {
  console.log('UpdateReleaseStatus to ' + aStatus);
  aItem.status = aStatus;
  appSchema.findOneAndUpdate({appkey:aItem.appkey}, {$set : {status : aStatus}}, function() { });
}

var getAppItemSync = function(aAppKey) {
  var ret = undefined;
  appSchema.findOne({appkey: aAppKey}, function(err, app) {
    if (err) {
      ret = { isSuccess: false, data: err };
    } else {
      ret = { isSuccess: true, data: app};
    }
  });

  while(ret === undefined) {
    require('deasync').runLoopOnce();
  }

  return ret;
}

var release = {
  getAll: function(req, res) {
    try {
      appSchema.find(function(err, apps) {
        if (err) {
          res.json(responseGenerator.getJson(3007, err));
        } else if (apps.length === 0) {
          res.json(responseGenerator.getJson(3006, err));
        } else {
          res.json(responseGenerator.getJson(0, apps));
        }
      });
    } catch (e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },

  create: function(req, res) {
    try {
      if (req.body.appkey === undefined) {
        res.json(responseGenerator.getJson(4000, null));
        return;
      }

      var queryApp = getAppItemSync(req.body.appkey);
      if (!queryApp.isSuccess) {
        res.json(responseGenerator.getJson(3007, queryApp.data));
        return;
      }

      console.log(JSON.stringify(queryApp));
      var targetApp = queryApp.data;
      if (release_status.isReleasing(targetApp.status)) {
        // Below is just for a development convinience.
        updateReleaseStatus(targetApp, release_status.REGISTERED);

        console.log('App is still on releasing');
        res.json(responseGenerator.getJson(3001, null));
        return;
      }

      res.json(responseGenerator.getJson(0, {appkey: targetApp.appkey}));
      updateReleaseStatus(targetApp, release_status.RELEASING);

      // cloning
      util_github.clone(targetApp, function(err, commitid) {
        if(err) {
          console.log('clone error : ' + JSON.stringify(err));
          updateReleaseStatus(targetApp, release_status.REGISTERED);
          return;
        } else {
          console.log('clone success');
        }

        util_findapp.findapp(targetApp, function(find_result) {
          console.log('find_result: ' + JSON.stringify(find_result));

          if(find_result.result == 'failed') {
            console.log('failed to find app directory.');
            updateReleaseStatus(targetApp, release_status.REGISTERED);
            //          res.json(responseGenerator.getJson(3002, null));
            return;
          }

          var appinfo = {};
          appinfo.appkey = targetApp.appkey;
          appinfo.app_version = find_result.pobj.version;
          appinfo.timestamp = new Date().valueOf();
          appinfo.srcpath = find_result.path.replace('package.json', '');
          appinfo.commitid = commitid;
          appinfo.os = req.body.os;

          libbuild.build(appinfo, function(results) {
            console.log('libbuild.build result : ' + JSON.stringify(results));
            if(results.result === 'failed') {
              updateReleaseStatus(targetApp, release_status.REGISTERED);
              return;
            }

            var publishObj = new publishSchema({
                appkey     : appinfo.appkey,
                appversion : appinfo.app_version,
                timestamp  : parseInt(appinfo.timestamp),
                commitid   : appinfo.commitid.toString(),
                targetpath : results.output,
                publish    : 'release',
                os         : appinfo.os,
                vfrom      : appinfo.app_version,
                vto        : appinfo.app_version
            });

            publishObj.save(function(err, result) {
              if (err) {
                console.log('publishCollection.add failed');
                updateReleaseStatus(targetApp, release_status.REGISTERED);
              } else {
                console.log('publishCollection.add success');
                updateReleaseStatus(targetApp, release_status.RELEASED);
              }
            });
          }); // libbuild.build
        }); // util_findapp.findapp
      }); // util_github.clone
      //    }); // util_release.getItemByQuery
    } catch(e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },

  getNotDeployedList: function(req, res) {
    try {
      console.log(req.body);
      publishSchema
        .find({
          appkey: req.body.appkey,
          appversion: req.body.appversion,
          publish: 'release',
          os: req.body.os,
        })
        .sort({"timestamp": -1})
        .exec(function(err, query_results) {
          if (err) {
            res.json(responseGenerator.getJson(3000, err));
          } else {
            res.json(responseGenerator.getJson(0, query_results));
          }
        });
    } catch (e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },

  getReleaseStatus: function(req, res) {
    try {
        // console.log('appinfo: ' + JSON.stringify(appinfo))
        appSchema.find({appkey : req.body.appkey}, function(err, query_results) {
          if (err) {
            res.json(responseGenerator.getJson(3000, err));
          } else if (query_results.length === 0) {
            res.json(responseGenerator.getJson(3006, null));
          } else {
            res.send(responseGenerator.getJson(0,
                { release_status : query_results[0].status }
                ));
          }
        });
    } catch (e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },
};

module.exports = release;
