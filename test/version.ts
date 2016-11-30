'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import loopback = require('loopback');
import Utils = require('./utils/test-utils');

let utils = new Utils.TestUtils(phoenix);
let rpath = require('path');
let selfPkg = require(rpath.resolve(__dirname, '../package.json'));

describe('REST API version request', function() {
  before(async function() {
    await utils.startServer();
    phoenix.models.Version.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      console.log('Remote Error detected on Version Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
  });

  after(async function() {
  });

  it('get version', async function() {
    let res = await utils.createApi(null, Utils.HTTPVerb.GET, '/v0/Version')
      .expect(200);
    let resText = JSON.parse(res.text);
    assert(resText.name, selfPkg.name);
    assert(resText.version, selfPkg.version);
    return;
  });
});
