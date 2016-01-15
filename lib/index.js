'use strict';

var hasRun = false,
    cache = undefined;

module.exports = function init(mongoose, cacheOptions, debug) {
  if (mongoose.version < '3.7') throw new Error('Cachegoose is only compatible with mongoose 3.7+');
  if (hasRun) return;
  hasRun = true;

  init._cache = cache = require('./cache')(cacheOptions);

  require('./extend-query')(mongoose, cache, debug);
  require('./extend-aggregate')(mongoose, cache, debug);
};

module.exports.clearCache = function (customKey) {
  var cb = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

  if (!customKey) return cb();
  cache.del(customKey, cb);
};