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
  var format = require('util').format;
  var dircompare = require('dir-compare');

  var util_updateresource = new Object();
  var spawn = require('child_process').spawn;

  util_updateresource.compare = function(current, latest, cb) {
    try {
      console.log('comparing resources .....');

      var current_dir =  format('%s/../../bb_apps/%s/%s/%s/build_%s', __dirname, current.appkey, current.commitid, current.appversion, current.timestamp);
      var latest_dir =  format('%s/../../bb_apps/%s/%s/%s/build_%s', __dirname, latest.appkey, latest.commitid, latest.appversion, latest.timestamp);

      console.log('  current_dir : ' + current_dir);
      console.log('  latest_dir : ' + latest_dir);


      var options = {compareSize:true};
      dircompare.compare(current_dir, latest_dir, options).then(function(res) {
        var r = [];
        var total = res.distinct + res.equal + res.left + res.right;
        var cnt = 0;

        console.log(format('  total: %s', total));

        res.diffSet.forEach(function (entry) {
          cnt++;
          if(cnt == total) {
            console.log('  resources: ' + r);
            return cb(null, r);
          }
          else {
            if((entry.type1 && entry.type1 == 'file') ||
               (entry.type2 && entry.type2 == 'file')) {
              console.log('entry.state : ' + entry.state + ' for ' + entry.name1);

              if((entry.name1 && entry.name1.search('.png') != -1) ||
                 (entry.name1 && entry.name1.search('.jpg') != -1) ||
                 (entry.name1 && entry.name1.search('.jpeg') != -1) ||
                 (entry.name2 && entry.name2.search('.png') != -1) ||
                 (entry.name2 && entry.name2.search('.jpg') != -1) ||
                 (entry.name2 && entry.name2.search('.jpeg') != -1)) {

                if(entry.state == 'left') {       // remove
                  var item = {};
                  item.contenturi = format('%s/%s', entry.path1, entry.name1);
                  var n = item.contenturi.lastIndexOf('build_'+current.timestamp);
                  item.contenturi = item.contenturi.substring(n);
                  item.contenturi = item.contenturi.replace('build_'+current.timestamp, '');
                  //item.contenturi = item.contenturi.replace(__dirname, '');
                  //item.contenturi = item.contenturi.replace('/../../bb_apps/', '');
                  item.state = 'remove';
                  r.push(item);
                }
                else if(entry.state == 'right') { // add
                  var item = {};
                  item.contenturi = format('%s/%s', entry.path2, entry.name2);
                  var n = item.contenturi.lastIndexOf('build_'+latest.timestamp);
                  item.contenturi = item.contenturi.substring(n);
                  item.contenturi = item.contenturi.replace('build_'+latest.timestamp, '');
                  //item.contenturi = item.contenturi.replace(__dirname, '');
                  //item.contenturi = item.contenturi.replace('/../../bb_apps/', '');
                  item.state = 'add';
                  r.push(item);
                }
                else if(entry.state == 'distinct') { // add
                  if(entry.date2 > entry.date1) {
                    var item = {};
                    item.contenturi = format('%s/%s', entry.path2, entry.name2);
                    var n = item.contenturi.lastIndexOf('build_'+latest.timestamp);
                    item.contenturi = item.contenturi.substring(n);
                    item.contenturi = item.contenturi.replace('build_'+latest.timestamp, '');
                    //item.contenturi = item.contenturi.replace(__dirname, '');
                    //item.contenturi = item.contenturi.replace('/../../bb_apps/', '');
                    item.state = 'add';
                    r.push(item);
                  }
                }
                else if(entry.state == 'equal') { // equal
                  var item = {};
                  item.contenturi = format('%s/%s', entry.path2, entry.name2);
                  var n = item.contenturi.lastIndexOf('build_'+latest.timestamp);
                  item.contenturi = item.contenturi.substring(n);
                  item.contenturi = item.contenturi.replace('build_'+latest.timestamp, '');
                  //item.contenturi = item.contenturi.replace(__dirname, '');
                  //item.contenturi = item.contenturi.replace('/../../bb_apps/', '');
                  item.state = 'equal';
                  r.push(item);
                }
              }
            }
          }
        });
      }).catch(function(error) {
        console.error(error);
        var r = {};
        r.errorcode = 1000;  // same file
        r.reason = 'No difference found.';
        cb(new Error('error'), r);
      });
    }
    catch(e) {
      console.error(error);
      var r = {};
      r.errorcode = 1009;
      r.reason = 'Unknown error.';
      cb(new Error('error'), r);
    }
  }

  util_updateresource.copyUpdatedResource = function(targetpath, dic, cb) {
    try {
      console.log('--------------------- util_updateresource.copyUpdatedResource');
      console.log('  targetpath : ' + targetpath);
      console.log('  dic : ' + JSON.stringify(dic));

      var len = dic.length;
      var counter = 0;
      dic.forEach(function(item) {
        console.log('item.contenturi : ' + item.contenturi);
        console.log('item.state : ' + item.state);
        console.log('\n');


        if(item.state == 'add') {
          counter++;
          if(counter == dic.length) cb(null);
        }
        else {
          fs.unlink(targetpath + item.contenturi, function(err) {
            counter++;
            if(counter == dic.length) {
              console.log('  to call cb()');
              cb(err);
            }
          });
        }
      });

    }
    catch(e) {
    }
  }

  module.exports = util_updateresource;
})();
