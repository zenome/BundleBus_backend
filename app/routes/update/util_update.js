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
  var diff_match_patch=require('googlediff');

  var util_update = new Object();

  util_update.patch = function(current, latest, cb) {
    try {
      console.log('patching.....');
      console.log('  latest : ' + latest.targetpath);
      var latest_bundle_path = latest.targetpath.replace('.bundle', '') + '/' + latest.timestamp + '.bundle';
      console.log('  latest modified : ' + latest_bundle_path);

      fs.readFile(latest_bundle_path, 'utf8', function(latest_err, latest_obj) {
        if (latest_err) {
          throw latest_err;
        }
        var current_bundle_path = current.targetpath.replace('.bundle', '') + '/' + current.timestamp + '.bundle';
        console.log('  current : ' + current_bundle_path);
        fs.readFile(current_bundle_path, 'utf8', function(current_err, current_obj) {
          if (current_err) {
            throw current_err;
          }
          /*
          console.log('//current bundle /////////////////////////////////////////////////////////////');
          console.log(current_obj);
          console.log('///////////////////////////////////////////////////////////////');
          console.log('\n\n');
          console.log('//latest bunele/////////////////////////////////////////////////////////////');
          console.log(latest_obj);
          console.log('///////////////////////////////////////////////////////////////');
          */
          var latest_data = latest_obj.toString();
          var current_data = current_obj.toString();

          var dmp = new diff_match_patch();
          var patches = dmp.patch_make(current_data, latest_data);

          if(patches.length > 0) { // patch

            //console.log('patches');
            //console.log(patches);

            var dir_info = current.appkey + '/' + current.commitid + '/patch' + '/' + 'patch-from-' + current.timestamp + '-to-' + latest.timestamp;
            var patch_info = dir_info + '/data.patch';

            var dir_path = require('path').resolve(__dirname, '../../bb_apps/' + dir_info);
            mkdirp(dir_path, function(err) {
              var patchpath = require('path').resolve(__dirname, '../../bb_apps/' + patch_info);
              fs.writeFile(patchpath, dmp.patch_toText(patches), function(err) {
                var r = {};
                r.commitid   = latest.commitid;
                r.timestamp  = latest.timestamp;
                r.appversion = latest.appversion;
                r.os         = latest.os;
                r.contenturi = patchpath;
                cb(null, r);
              });
            });
          }
          else { 
            var r = {};
            r.errorcode = 1000;  // same file
            r.reason = 'No difference found.';
            cb(new Error('error'), r);
          }
        });
      });
      
    }
    catch(e) {
      console.log(e);
    }
  }

  module.exports = util_update;
})();
