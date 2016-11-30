'use strict';
/*
 A mixin for adding accessing userid to data models
 */
import loopback = require('loopback');
const LBContext = require('loopback-context');
module.exports = function(Model: DataSource, options: loopback.MixinOptions) {
  Model.defineProperty('createdBy', {type: String});
  Model.defineProperty('modifiedBy', {type: String});
  Model.observe('before save', function event(ctx, next) {
    let cctx = LBContext.getCurrentContext();
    let accessToken = cctx && cctx.get('accessToken');
    let user = cctx && cctx.get('currentUser');
    if (ctx.instance) { // first time : create
      ctx.instance.createdBy = user.username;
      ctx.instance.modifiedBy = user.username;
    } else { // update
      ctx.data.modifiedBy = user.username;
    }
    next();
  });
};
