/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'


const respGenerator = require('../util/responseGenerator');

const SHOULD_HAVE_FIELD_PUBLISH = [
  '/api/update',
  '/api/update_resource',
]

let checkShouldHaveFieldPublish = function(req) {
  for (let i = 0; i < SHOULD_HAVE_FIELD_PUBLISH.length; i++) {
    if (SHOULD_HAVE_FIELD_PUBLISH[i] === req.url) {
      if (req.body.type != 'release' &&
          req.body.type != 'deploy') {
        console.log('Unavailable publish keyword : ' + req.body.type);
        return false;
      }
    }
  }
  
  return true;
}

module.exports = function(req, res, next) {
  /*
  console.log('RequestValidator url: '     + req.url);
  console.log('RequestValidator params: ' + JSON.stringify(req.params));
  console.log('RequestValidator req: '    + JSON.stringify(req.body));
  */
 
  // 'publish' key check
  if (!checkShouldHaveFieldPublish(req)) {
    res.json(respGenerator.getJson(5002, null));
    return;
  }

  next();
  return;
};
