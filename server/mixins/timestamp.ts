'use strict';
/*
 A mixin for adding access timestamp to data models
 */
import loopback = require('loopback');
module.exports = function(Model: DataSource, options: loopback.MixinOptions) {
  Model.defineProperty('created', {type: Date, default: '$now'});
  Model.defineProperty('modified', {type: Date, default: '$now'});
  Model.observe('before save', function event(ctx, next) {
    if (!ctx.instance) { // update
      ctx.data.modified = new Date();
    }
    next();
  });
};
