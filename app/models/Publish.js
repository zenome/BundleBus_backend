/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'
 
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var publishSchema = new Schema({
  appkey: String,
  appversion: String,
  timestamp: Number,
  commitid: String,
  targetpath: String,
  publish: String,
  os: String,
  vfrom: String,
  vto: String
});

module.exports = mongoose.model('publish', publishSchema);
