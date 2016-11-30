/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'

var uuid = require('node-uuid');

var appSchema = require('../../models/App');
var release_status = require('../../util/release_status.js');
var responseGenerator = require('../../util/responseGenerator.js');

var register = {
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
    } catch(e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },

  create: function(req, res) {
    try {
      console.log('\nPOST /register begin');
      // Check if a app is already REGISTERED
      appSchema
        .find({cloneurl : req.body.cloneurl})
        .exec(function(err, item) {
          if (err) {
            res.json(responseGenerator.getJson(3008, err));
          } else {
            if (item.length === 0) {
              var app = new appSchema({
                github_token: req.body.github_token,
                cloneurl: req.body.cloneurl,
                appname: req.body.appname,
                appkey: uuid.v4(),
                status: release_status.REGISTERED
              });

              console.log(`appSchema : ' ${JSON.stringify(app)}`);
              app.save(function (err) {
                if (err) {
                  res.json(responseGenerator.getJson(3008, err));
                } else {
                  res.json(responseGenerator.getJson(0, app));
                }
              });
            } else {
              console.log(`App is already registered : ${item}`);
              res.json(responseGenerator.getJson(0, item[0]));
            }
          }
        })
    } catch(e) {
      console.log(e);
      res.json(responseGenerator.getJson(9999, e));
    }
  },
};

module.exports = register;
