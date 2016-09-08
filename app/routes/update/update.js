/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'

var fs = require('fs');

var spawn = require('child_process').spawn;
var jsonfile = require('jsonfile');

var publishSchema = require('../../models/Publish');
var util_update = require('./util_update');
var util_updateresource = require('../updateresource/util_updateresource');
var responseGenerator = require('../../util/responseGenerator');

var update = {
  create: function(req, res) {
    try {
      console.log(req.body);
     
      var appkey       = req.body.appkey;
      var appversion   = req.body.appversion;
      var timestamp    = parseInt(req.body.timestamp);
      var commitid     = req.body.buildid;
      var publish      = req.body.type;
      var reqos        = req.body.os;

      console.log('//////////////////////////////////////////////////////////');
      console.log('appkey: '     + appkey);
      console.log('appversion: ' + appversion);
      console.log('timestamp: '  + timestamp);
      console.log('commitid: '   + commitid);
      console.log('publish: '    + publish);
      console.log('os: '         + reqos);
      console.log('//////////////////////////////////////////////////////////\n');

      if(appversion === '0' || appversion === '0.0') {
        ///////////////////////////////////////////////////////////////////
        // init
        ///////////////////////////////////////////////////////////////////
        publishSchema
          .findOne({appkey: appkey, publish:publish, os:reqos})
          .sort({'timestamp': -1})
          .exec(function(err, item) {
            if (err) {
              res.json(responseGenerator.getJson(5001, err));
              return;
            }

            res.json(responseGenerator.getJson(0, 
                  {
                    action: 'download',
                    url: '/api/downloadbundle',
                    appversion: item.appversion,
                    key: item.timestamp
                  }));
          });
      } else {
        ///////////////////////////////////////////////////////////////////
        // check updatable
        ///////////////////////////////////////////////////////////////////
        if(publish != 'release' && publish != 'deploy') {
          res.json(responseGenerator.getJson(5002, null));
          return;
        }
        
        publishSchema
          .find({
            appkey     : appkey,
            publish    : publish,
            os         : reqos,
            timestamp  : {$gte:timestamp}
          })
          .sort({'timestamp': -1})
          .exec(function(err, items) {
            if (err) {
              res.json(responseGenerator.getJson(5003, err));
              return;
            }

            var item = items[0];
            console.log('Found %d deploy bundles', items.length);
            if(timestamp === item.timestamp) { 
              console.log('  no update');
              var r = {}; 
              r.action = 'noupdate'; 
              res.json(responseGenerator.getJson(0, r));
              return;
            }

            var q2 = {};
            q2.publish = 'patch';
            q2.vfrom   = items[items.length-1].appversion;
            q2.vto     = item.appversion;

            publishSchema.find(q2)
              .sort({'timestamp': -1})
              .exec(function(err, query_results) {
                if(err) {
                  res.json(responseGenerator.getJson(5003, err));
                  return;
                }

                console.log('Found patch version');
                if(query_results.length > 0 && query_results[0].timestamp > item.timestamp) {
                  console.log('the length is greather than 0');
                  var qitem = query_results[0];
                  var return_value = {};
                  return_value.action     = 'patch';
                  return_value.url        = '/api/downloadBundle';
                  return_value.key        = qitem.timestamp;
                  return_value.appversion = qitem.appversion;
                  return_value.fromkey    = items[items.length -1].timestamp;
                  return_value.tokey      = item.timestamp;

                  res.json(responseGenerator.getJson(0, return_value));
                } else {
                  console.log('Found but the length is 0');
                  util_update.patch(items[items.length-1], item, function(err, patch_result) {
                    if(err) {
                      res.json(responseGenerator.getJson(5008, err));
                      return;
                    }
                          
                    util_updateresource.compare(items[items.length-1], item, function(err, resource_compare_result) {
                      if(err) {
                        res.json(responseGenerator.getJson(5009, err));
                        return;
                      }

                      var n = item.targetpath.lastIndexOf('/');
                      var latest_dir = item.targetpath.substring(0, n) + '/';
                      var patch_dir = patch_result.contenturi.replace('data.patch', '');
                      var bundle_filename = item.targetpath.substring(n+1);
                      console.log('--------------------------- bundle_filename : ' + bundle_filename);
                      console.log('--------------------------- latest_dir: ' + latest_dir);
                      console.log('--------------------------- patch_dir: ' + patch_dir);

                      var cpr = spawn('cp', ['-R', latest_dir, patch_dir], {});
                      cpr.stdout.on('data', (data) => {
                        //console.log(`stdout: ${data}`);
                      });

                      cpr.stderr.on('data', (data) => {
                        //console.log(`stderr: ${data}`);
                      });

                      cpr.on('close', (code) => {
                        var to_be_removed_bundle = patch_dir + bundle_filename.replace('.bundle', '') + '/' + item.timestamp + '.bundle';
                        console.log('  to_be_removed_bundle : ' + to_be_removed_bundle);
                        var rm = spawn('rm', [patch_dir + '.DS_Store', patch_dir + bundle_filename, to_be_removed_bundle], {});
                        rm.stdout.on('data', (data) => {
                          //console.log(`stdout: ${data}`);
                        });

                        rm.stderr.on('data', (data) => {
                          //console.log(`stderr: ${data}`);
                        });

                        rm.on('close', (code) => {
                          util_updateresource.copyUpdatedResource(patch_dir + 'build_'+item.timestamp, resource_compare_result, function (err) {
                            // resource status to json file
                            jsonfile.writeFile(patch_dir+'resources.json', resource_compare_result, function (err) {
                              console.log('write resource data to file.');
                              console.error(err);
                              if(err) {
                                res.json(responseGenerator.getJson(5010, err));
                                return;
                              }

                              var update_filename = patch_result.contenturi.replace('/data.patch', '');
                              var m = update_filename.lastIndexOf('/');
                              update_filename = update_filename.substring(m+1)+'.update';
                              m = patch_dir.lastIndexOf('/patch/');
                              var target_folder = patch_dir.substring(m+1+6);
                              console.log('--------------------------- target_folder: ' + target_folder);
                              target_folder = target_folder.replace('/', '');

                              var zip_bundle = spawn('tar', 
                                ['fvcz', update_filename, target_folder], 
                                {cwd:patch_dir + '/../', env: process.env});

                              zip_bundle.stdout.on('data', (data) => {
                                //console.log(`stdout: ${data}`);
                              });

                              zip_bundle.stderr.on('data', (data) => {
                                //console.log(`stderr: ${data}`);
                              });

                              zip_bundle.on('close', (code) => {
                            
                                var k = patch_dir.lastIndexOf('/');
                                var tpath = patch_dir.substring(0, k);

                                var publishObj = new publishSchema({
                                    appkey     : item.appkey,
                                    appversion : item.appversion,
                                    timestamp  : new Date().valueOf(),
                                    commitid   : item.commitid.toString(),
                                    targetpath : tpath + '.update',
                                    publish    : 'patch',
                                    os         : item.os,
                                    vfrom      : items[items.length-1].appversion,
                                    vto        : item.appversion
                                });

                                     
                                publishObj.save(function(err) {
                                  //console.log(JSON.stringify(add_result));
                                  if(err) {
                                    res.json(responseGenerator.getJson(5004, null));
                                    return;
                                  }

                                  console.log('publishCollection.add success');
                                  var return_value = {};
                                  return_value.action     = 'patch';
                                  return_value.url        = '/api/downloadBundle';
                                  return_value.vfrom      = publishObj.vfrom;
                                  return_value.appversion = publishObj.appversion;
                                  return_value.key        = publishObj.timestamp;
                                  return_value.fromkey    = items[items.length -1].timestamp;
                                  return_value.tokey      = item.timestamp;

                                  res.json(responseGenerator.getJson(0, return_value));
                            });  // end of publishCollection.addItem
                          }); // zip_bundle.on
                        }); // end of jsonfile.writeFile(....
                      }); // util_updateresource.copyUpdateResource(...
                    }); // rm.on('close', ...
                  }); // end of cpr.on
                }); // util_updateresource.compare
              }); // util_update.patch
            }
          }); // publishCollection.getItemByQueryAndSort
        }); // publishCollection.getItemByQueryAndSort
      }
    } catch (e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
      throw(e);
    }
  },
  downloadBundle: function(req, res) {
    try {
      var appkey       = req.body.appkey;
      var timestamp    = parseInt(req.body.key);

      var q = {};
      q.appkey     = appkey;
      q.timestamp  = timestamp;

      publishSchema.find({appkey: appkey, timestamp:timestamp})
        .sort({'timestamp': -1})
        .exec(function(err, items) {
          if(items.length > 0) {
            var item = items[0];
            console.log('  download path: ' + item.targetpath);
            res.download(item.targetpath);
          } else {
            res.send({status:'error', errorcode:6001, reason:"couldn't find appropriate apps."});
          }
      });
    }
    catch (e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
      throw(e);
    }
  }
};

module.exports = update;
