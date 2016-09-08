/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function() {

  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var child=require("child_process");
  var spawn = require('child_process').spawn;

  var util_resource = require('./util_resource');
  
  var libbuild = new Object();
  
  libbuild.build = function(item, cb) {
    //var localPath = require("path").join(__dirname, item.appkey);
    var localPath = item.srcpath;
    var newPathFolder = __dirname + '/../../bb_apps/' + item.appkey + '/' + item.commitid + '/' + item.app_version + '/build_' + item.timestamp;

    console.log('installing modules ...');
    var install_module_bundle = spawn('npm', ['install'], {cwd:localPath, env: process.env});

    install_module_bundle.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    install_module_bundle.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    install_module_bundle.on('close', (code) => {

      console.log('building ...');
      var build_bundle = spawn('react-native',
                     ['bundle',
                      '--entry-file=index.' + item.os +'.js',
                      '--bundle-output=output.' +item.os+ '.bundle',
                      '--dev=false',
                      '--platform=' + item.os],
                     {cwd:localPath, env: process.env});
      build_bundle.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
     
      build_bundle.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });
     
      build_bundle.on('close', (code) => {
        if (code == 0) {
          console.log(`child process exited with code ${code}`);
          console.log('  build success.');
     
          mkdirp(newPathFolder, function (err) {
            if (err) {
              console.log(err);
              cb({result:'failed', err:err});
            }
            else {
              var cp_bundle = spawn('cp',
                                    ['-R', localPath + 'output.' + item.os + '.bundle', newPathFolder + '/' + item.timestamp + '.bundle'],
                                    {});
              cp_bundle.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
              });
             
              cp_bundle.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
              });
             
              cp_bundle.on('close', (code) => {
                console.log(`on close : code ${code}`);
                util_resource.build(localPath, newPathFolder, function(resource_build_result) {
                  if(resource_build_result.result == 'success') {

                    var bundlepath = newPathFolder;

                    var zip_bundle = spawn('tar', 
                                           ['fvcz', newPathFolder + '/../build_' + item.timestamp + '.bundle',  './build_' + item.timestamp], 
                                           {cwd:newPathFolder + '/../', env: process.env});
                    zip_bundle.stdout.on('data', (data) => {
                      console.log(`stdout: ${data}`);
                    });

                    zip_bundle.stderr.on('data', (data) => {
                      console.log(`stderr: ${data}`);
                    });

                    zip_bundle.on('close', (code) => {
                      var rm_bundle = spawn('rm',
                                ['-rf',
                                 localPath],
                                 {});
                      rm_bundle.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                      });
                     
                      rm_bundle.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                      });
                     
                      rm_bundle.on('close', (code) => {
                        console.log('to call cb after removing directory for build.');
                        cb({result:"success", output: newPathFolder + '.bundle'});
                      });
                    });
                  } else {
                    console.log("resource_build_result.result is failed");
                    cb({result:'failed', output: 'resource_build_result.result is failed'});
                  }
                });

              });
            }
          });
        }
        else {
          console.log(process.env);
          console.log('  build failed.');
          var rm_bundle = spawn('rm',
                    ['-rf',
                     localPath],
                     {});
          rm_bundle.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });
     
          rm_bundle.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });
     
          rm_bundle.on('close', (code) => {
            return cb('{"result":"failed"}');
          });
        }
      });
    });
  }
    

  module.exports = libbuild;
})();
