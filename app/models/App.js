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

var appSchema = new Schema({
  github_token: String,
  cloneurl: String,
  appname: String,
  appkey: String,
  status: String
});

module.exports = mongoose.model('app', appSchema);
