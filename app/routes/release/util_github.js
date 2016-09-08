/**
 * Copyright (c) 2016-present ZENOME, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function() {
  var NodeGit = require("nodegit");
  var util_github = new Object();

  try {
    util_github.clone = function(meta, cb) {
      console.log('cloning ' + meta.cloneurl);
      var localPath = require("path").join(__dirname, meta.appkey);
      
      var cloneOptions = {};
      
      cloneOptions.fetchOpts = {
        callbacks: {
          certificateCheck: function() { return 1; },
          credentials: function() {
            return NodeGit.Cred.userpassPlaintextNew(meta.github_token, "x-oauth-basic");
          }
        }
      };
      
      var cloneRepository = NodeGit.Clone(meta.cloneurl, localPath, cloneOptions);

      var getMostRecentCommit = function(repository) {
        return repository.getBranchCommit("master");
      };

      var getCommitMessage = function(commit) {
        return commit.message();
      };

      var getCommitId = function(commit) {
        return commit.id();
      };
      
      var errorAndAttemptOpen = function() {
        NodeGit.Repository.open(localPath)
        .then(getMostRecentCommit)
        .then(getCommitId)
        .then(function(commitid) {
          console.log('------------- commit id on error:' + commitid);
          cb(new Error('error'), commitid);
        });

      };
      
      cloneRepository.catch(errorAndAttemptOpen)
        .then(function(repository) {
          repository.getMasterCommit()
          .then(getCommitId)
          .then(function(commitid) {
            console.log('------------- commit id:' + commitid);
            cb(null, commitid);
          });
        });
    }
  }
  catch(e) {
    console.log(e);
  }
  module.exports = util_github;

})();
