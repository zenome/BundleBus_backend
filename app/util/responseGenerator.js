'use strict'

var responseGenerator = {
  getJson: function(aCode, aResult) {
    var json = {
      status : aCode,
      message : getMessage(aCode),
      result : aResult
    };

    return json;
  }
};

var getMessage = function(aCode) {
  switch(aCode) {
    case 0 :
      return 'Success';
    case 3000 : 
      return 'Getting an item from database is failed.';
    case 3001 :
      return 'App is still on releasing';
    case 3002 :
      return "System can't find the requested app";
    case 3003 : 
      return 'Failed to build app';
    case 3004 :
      return 'Failed to update a database to publish';
    case 3005 :
      return 'Failed to clone github';
    case 3006 :
      return 'Success to query a app database but it has no entry.';
    case 3007 :
      return 'Failed to query a app database.';
    case 3008 :
      return 'Failed to save item into a app database.';
    case 4000 :
      return 'Missed a mandatory field';
    case 5001 :
      return 'No ready application.';
    case 5002 : 
      return 'Unknown publish type';
    case 5003 : 
      return 'Error during query a publish database.';
    case 5004 :
      return 'Publish success but failed to update a publish database';
    case 5005 :
      return 'Error to compare using updateResource.compare';
    case 5006 :
      return 'Success to query a publish database but the result has no entry.';
    case 5007 :
      return 'Failed to save a data into a publish database';
    case 5008 :
      return 'Failed to build patch file';
    case 5009 :
      return 'Failed to build resource patch';
    case 5010 :
      return 'Failed to write resource status to file';
    case 9999 : 
      return 'System Error';
    default :
      return 'Unknown error';
  }
}

module.exports = responseGenerator;
