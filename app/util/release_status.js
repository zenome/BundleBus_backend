'use strict';

var REGISTERED = 'REGISTERED';
var RELEASING = 'RELEASING';
var RELEASED = 'RELEASED';

var isReleasing = function(status) {
  if (status === RELEASING) {
    return true;
  }

  return false;
}

module.exports = {
  REGISTERED : REGISTERED,
  RELEASING : RELEASING,
  RELEASED : RELEASED,
  isReleasing : isReleasing

}
