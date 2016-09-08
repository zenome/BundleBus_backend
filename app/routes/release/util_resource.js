/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function(){
  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var spawn = require('child_process').spawn;

  var util_resource = new Object();

  function getFiles(dir, fileList){
      fileList = fileList || [];
 
      var files = fs.readdirSync(dir);
      for(var i in files){
          if (!files.hasOwnProperty(i)) continue;
          if (files[i].search('node_modules') != -1) continue;
          if (files[i].search('android') != -1) continue;
          if (files[i].search('ios') != -1) continue;
          var name = dir+'/'+files[i];
          if (fs.statSync(name).isDirectory()){
              getFiles(name, fileList);
          } else {
              if (files[i].search('.png') != -1 ||
                  files[i].search('.jpg') != -1 ||
                  files[i].search('.jpeg') != -1
                  ) {
                fileList.push(name);
              }
          }
      }
      return fileList;
  }

  util_resource.build = function(src, dst, cb) {

    var list = getFiles(src);
    if (list.length === 0) {
        cb({result:'success'});
        return;
    }

    var cnt = 0;
    for(var i in list) {
      console.log('opening ' + list[i]);

      (function(i) {
        var target_path = list[i].replace(src, dst);
        var n = target_path.lastIndexOf('/');
        var newPath = target_path = target_path.substring(0, n);
        console.log('  target_path : ' + target_path);

        ///*
        mkdirp(newPath, function (err) {
          var build_bundle = spawn('/bin/cp',
                         ['-p',
                          list[i],
                          target_path
                         ],
                         {env: process.env});

          build_bundle.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });
       
          build_bundle.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
          });
       
          build_bundle.on('close', (code) => {
          });
        });
        //*/

      })(i);


      cnt++;
      if(cnt == list.length) {
        cb({result:'success'});
      }
    }
  }

  module.exports = util_resource;
})();
