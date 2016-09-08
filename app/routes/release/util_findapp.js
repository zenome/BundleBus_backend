/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function() {
  var fs = require('fs');
  var jsonfile = require('jsonfile')

  var util_findapp = new Object();

  function getFiles(dir, fileList){
    try {
      fileList = fileList || [];
  
      var files = fs.readdirSync(dir);
      for(var i in files){
 
          if (!files.hasOwnProperty(i)) continue;
          if (files[i].search('.git') != -1) continue;
          if (files[i].search('node_modules') != -1) continue;
          if (files[i].search('android') != -1) continue;
          if (files[i].search('ios') != -1) continue;
          var name = dir+'/'+files[i];
          if (fs.statSync(name).isDirectory()){
              getFiles(name, fileList);
          } else {
              if (files[i].search('package.json') != -1) {
                fileList.push(name);
              }
          }
      }
      return fileList;
    }
    catch(e) {
      console.log(e);
    }
  }

  util_findapp.findapp = function(item, cb) {

    try {
      var localPath = require("path").join(__dirname, item.appkey);
      //console.log('util_findapp: ' + localPath);
     
      var list = getFiles(localPath);
      //console.log('getFiles result: ' + list);
     
      var found = false;
      var cnt = 0;
      for(var i in list) {
        //console.log('opening ' + list[i]);
        (function(i) {
          if(found)  {
            cnt++;
            if(cnt == list.length) {
              cb({result:'failed'});
            }
          }
          else {
            jsonfile.readFile(list[i], function(err, obj) {
              if(obj.name == item.appname) {
                found = true;
                cb({result:'success', path:list[i], pobj:obj});
              }
              else {
                cnt++;
                if(cnt == list.length) {
                  cb({result:'failed'});
                }
              }
            })
          }
     
        })(i);
     
      }
    }
    catch(e) {
      console.log(e);
    }


  };

  module.exports = util_findapp;
})();
