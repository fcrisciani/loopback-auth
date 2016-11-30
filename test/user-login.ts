'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import Utils = require('./utils/test-utils');
import loopback = require('loopback');

let utils = new Utils.TestUtils(phoenix);
let userId: number;

describe('REST API USER Login/Logout Tests', function() {
  before(async function() {
    await utils.startServer();
    phoenix.models.user.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      console.log('Remote Error detected on USER Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
  });

  after(async function() {
  });

  it('should return fail login', async function() {
    let res = await utils.createApi(null, Utils.HTTPVerb.POST, '/v0/users/login')
      .send({username: 'foo', password: 'bar'})
      .expect(401);
    return;
  });

  it('Create User', async function() {
    let res = await utils.createApi(null, Utils.HTTPVerb.POST, '/v0/users')
      .send({username: 'foo', password: 'bar', realm: 'admin', email: 'foo@bar.com'})
      .expect(200);
    userId = JSON.parse(res.text).id;
    return;
  });

  it('should succeed in login', async function() {
    let res = await utils.createApi(null, Utils.HTTPVerb.POST, '/v0/users/login')
      .send({username: 'foo', password: 'bar'})
      .expect(200);
    let authToken = JSON.parse(res.text).id;
    assert.notEqual(authToken, undefined);
    assert.equal(authToken.length, 64);
    utils.setUserAuthToken('foo', authToken);
    return;
  });

  it('Check User', async function() {
    let res = await utils.createApi('foo', Utils.HTTPVerb.GET, `/v0/users/${userId}`)
      .expect(200);
    let resText = JSON.parse(res.text);
    assert(resText.realm, 'admin');
    assert(resText.username, 'foo');
    assert(resText.email, 'foo@bar.com');
    assert(resText.id, userId);
    return;
  });

  it('should succeed in logout', async function() {
    let res = await utils.createApi('foo', Utils.HTTPVerb.POST, '/v0/users/logout')
      .expect(204);
    return;
  });

  it('login as Administrator, always present', async function() {
    let res = await utils.createApi('admin', Utils.HTTPVerb.POST, '/v0/users/login')
      .send({username: 'admin', password: 'loopbackauth'})
      .expect(200);
    let authToken = JSON.parse(res.text).id;
    assert.notEqual(authToken, undefined);
    assert.equal(authToken.length, 64);
    utils.setUserAuthToken('foo', authToken);
    return;
  });

});
