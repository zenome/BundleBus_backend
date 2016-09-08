/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function() {

  var mongo = require('mongodb');
  var ObjectID = require('mongodb').ObjectID;

  var Server = mongo.Server;
  var Db = mongo.Db;

  var server = new Server('localhost', 27017, {auto_reconnect: true});
  var appdb = new Db('appdb', server);


  appdb.open(function(err, db) {
      if(!err) {
          console.log("Connected to 'appdb' database from appCollection");
          db.collection('app', {safe:true}, function(err, collection) {
              if (err) {
                  console.log("The 'app' collection doesn't exist.");
              }
          });
      }
  });

  var appCollection = {};

  appCollection.getItem = function(cb) {
    appdb.collection('app', function(err, collection) {
      collection.find().toArray(function(err, items) {
        cb(items);
      });
    });
  };

  appCollection.updateItem = function(item, cb) {
    appdb.collection('app', function(err, collection) {
      var itemToUpdate = {_id : ObjectID(item._id)};
      console.log("item: " + JSON.stringify(itemToUpdate));
      delete item._id;
      collection.update(itemToUpdate, {$set:item}, function(err, results) {
        console.log("udpated:");
        console.log("  err: " + err);
        console.log("  results: " + results);
        appCollection.getItem(cb);
      });
    });
  };

  appCollection.addItem = function(item, cb) {
    appdb.collection('app', function(err, collection) {
      collection.insert(item, function(err, results) {
        appCollection.getItem(cb);
      });
    });
  };


  appCollection.deleteItem = function(lid, cb) {
    appdb.collection('app', function(err, collection) {
      var deleteObject = {_id : ObjectID(lid)};
      collection.deleteMany(deleteObject, function(err, results) {
        appCollection.getItem(cb);
      });
    });
  };

  appCollection.getresponse_with_api = function(param_apiname, cb) {
    console.log('api_name: ' + param_apiname);
    appdb.collection('app', function(err, collection) {
      collection.find({apiname:param_apiname}).toArray(function(err, items) {
        cb(items);
      });
    });
  };

  appCollection.getUserByQuery = function(query, cb) {
    console.log('query : ' + query);
    appdb.collection('app', function(err, collection) {
      collection.find(query).toArray(function(err, items) {
        cb(err, items);
      });
    });
  };

  appCollection.getUserByQuerySync = function(query) {
    var ret = undefined;
    console.log('query : ' + query);
    appdb.collection('app', function(err, collection) {
      collection.find(query).toArray(function(err, items) {
        if (err) {
          throw new Error(err);
        }
        ret = items;
      });
    });

    while(ret === undefined) {
      require('deasync').runLoopOnce();
    }

    return ret;
  };

  module.exports = appCollection;
})();
