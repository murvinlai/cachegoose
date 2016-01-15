'use strict';

var generateKey = require('./generate-key');

module.exports = function (mongoose, cache, debug) {
  var exec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.exec = function (op) {
    var _this = this;

    var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

    if (!this.hasOwnProperty('_ttl')) return exec.apply(this, arguments);

    if (typeof op === 'function') {
      callback = op;
      op = null;
    } else if (typeof op === 'string') {
      this.op = op;
    }

    var key = this._key || this.getCacheKey(),
        ttl = this._ttl,
        isLean = this._mongooseOptions.lean,
        model = this.model.modelName,
        promise = new mongoose.Promise();

    promise.onResolve(callback);

    cache.get(key, function (err, cachedResults) {
      if (cachedResults) {
        if (!isLean) {
          var _constructor = mongoose.model(model);
          cachedResults = Array.isArray(cachedResults) ? cachedResults.map(inflateModel(_constructor)) : inflateModel(_constructor)(cachedResults);
        }

        if (debug) cachedResults._fromCache = true;
        promise.resolve(null, cachedResults);
      } else {
        exec.call(_this).onResolve(function (err, results) {
          if (err) return promise.resolve(err);
          cache.set(key, results, ttl, function () {
            promise.resolve(null, results);
          });
        });
      }
    });

    return promise;
  };

  mongoose.Query.prototype.cache = function () {
    var ttl = arguments.length <= 0 || arguments[0] === undefined ? 60 : arguments[0];
    var customKey = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    if (typeof ttl === 'string') {
      customKey = ttl;
      ttl = 60;
    }

    this._ttl = ttl;
    this._key = customKey;
    return this;
  };

  mongoose.Query.prototype.getCacheKey = function () {
    var key = {
      model: this.model.modelName,
      op: this.op,
      skip: this.options.skip,
      limit: this.options.limit,
      _options: this._mongooseOptions,
      _conditions: this._conditions,
      _fields: this._fields,
      _path: this._path,
      _distinct: this._distinct
    };

    return generateKey(key);
  };
};

function inflateModel(constructor) {
  return function (data) {
    if (constructor.inflate) {
      return constructor.inflate(data);
    } else {
      var model = constructor(data);
      model.$__reset();
      model.isNew = false;
      return model;
    }
  };
}