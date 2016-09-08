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
          console.log("Connected to 'appdb' database from publishCollection");
          db.collection('publish', {safe:true}, function(err, collection) {
              if (err) {
                  console.log("The 'publish' collection doesn't exist.");
              }
          });
      }
  });

  var publishCollection = {};

  publishCollection.getItem = function(cb) {
    appdb.collection('publish', function(err, collection) {
      collection.find().toArray(function(err, items) {
        cb(items);
      });
    });
  };

  publishCollection.updateItem = function(item, cb) {
    appdb.collection('publish', function(err, collection) {
      var itemToUpdate = {_id : ObjectID(item._id)};
      console.log("item: " + JSON.stringify(itemToUpdate));
      delete item._id;
      collection.update(itemToUpdate, {$set:item}, function(err, results) {
        console.log("udpated:");
        console.log("  err: " + err);
        console.log("  results: " + results);
        publishCollection.getItem(cb);
      });
    });
  };

  publishCollection.addItem = function(item, cb) {
    appdb.collection('publish', function(err, collection) {
      collection.insert(item, function(err, results) {
        publishCollection.getItem(cb);
      });
    });
  };


  publishCollection.deleteItem = function(lid, cb) {
    appdb.collection('publish', function(err, collection) {
      var deleteObject = {_id : ObjectID(lid)};
      collection.deleteMany(deleteObject, function(err, results) {
        publishCollection.getItem(cb);
      });
    });
  };

  publishCollection.getItemByQuery = function(query, cb) {
    appdb.collection('publish', function(err, collection) {
      collection.find(query).toArray(function(err, items) {
        cb(err, items);
      });
    });
  };
  publishCollection.getItemByQueryAndSort = function(query, cb) {
    appdb.collection('publish', function(err, collection) {
      collection.find(query).sort({timestamp:-1}).toArray(function(err, items) {
        cb(err, items);
      });
    });
  };

  module.exports = publishCollection;
})();
