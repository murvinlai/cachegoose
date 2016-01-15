'use strict';

var Cacheman = require('cacheman'),
    noop = function noop() {};

function Cache(options) {
  this._cache = new Cacheman('cachegoose-cache', options);
}

Cache.prototype.get = function (key) {
  var cb = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

  return this._cache.get(key, cb);
};

Cache.prototype.set = function (key, value, ttl) {
  var cb = arguments.length <= 3 || arguments[3] === undefined ? noop : arguments[3];

  if (ttl === 0) ttl = -1;
  return this._cache.set(key, value, ttl, cb);
};

Cache.prototype.del = function (key) {
  var cb = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

  return this._cache.del(key, cb);
};

Cache.prototype.clear = function () {
  var cb = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

  return this._cache.clear(cb);
};

module.exports = function (options) {
  return new Cache(options);
};