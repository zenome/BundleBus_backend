/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'

var responseGenerator = require('../../util/responseGenerator');
var PublishModel = require('../../models/Publish');

var deploy = {
  getMatchedVersion: function(req, res) {
    try {
      PublishModel.find({appversion: req.query.appversion}, function(err, publishes) {
        if (err) {
          console.log('err : ' + err);
          res.json(responseGenerator.getJson(5003, err));
        } else {
          console.log('result : ' + publishes);
          res.json(responseGenerator.getJson(0, publishes));
        }
      });
    } catch(e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },
  create: function(req, res) {
    try {
      var publish = new PublishModel({
        _id        : req.body._id,
        appkey     : req.body.appkey,
        appversion : req.body.appversion,
        publish    : 'deploy',
        os         : req.body.os,
      });

      publish.update(publish, 
          {$set: {publish:'deploy'}}, 
          function(err, result) {
        if (err) {
          res.json(responseGenerator.getJson(5007, err));
        } else {
          res.json(responseGenerator.getJson(0, null));
        }
      });
    } catch(e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  }
};

module.exports = deploy;

