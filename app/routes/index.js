/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

var express = require('express');
var router = express.Router();

var deploy    = require('./deploy/deploy');
var register  = require('./register/register');
var release   = require('./release/release');
var update    = require('./update/update');

router.get('/api/register', register.getAll);
router.post('/api/register', register.create);

router.get('/api/release', release.getAll);
router.post('/api/release', release.create);
router.post('/api/notdeployedlist', release.getNotDeployedList);
router.post('/api/status', release.getReleaseStatus);

router.get('/api/deploy', deploy.getMatchedVersion);
router.post('/api/deploy', deploy.create);


router.post('/api/update', update.create);
router.post('/api/downloadBundle', update.downloadBundle);

module.exports = router;
