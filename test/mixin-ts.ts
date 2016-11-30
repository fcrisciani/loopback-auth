'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import loopback = require('loopback');
import Utils = require('./utils/test-utils');
import Roles = require('../common/models/model_roles');

let utils = new Utils.TestUtils(phoenix);
let storeEntryId: number;
const user1 = 'mixin-ts1';
const user2 = 'mixin-ts2';
const users = [user1, user2];

describe('MIXIN TS and Access Test', function() {
  before(async function() {
    await utils.startServer();
    phoenix.models.Store.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      console.log('Remote Error detected on Store Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
    await utils.createUsers(users);
    await utils.loginUsers(users);
    await utils.assignUserRole('admin', user1, Roles.ModelRoles.$model_admin, 'Store', '0');
    await utils.assignUserRole('admin', user2, Roles.ModelRoles.$model_admin, 'Store', '0');
    return;
  });

  after(async function() {
    await utils.logoutUsers();
    return;
  });

  it('Mixin Create a Store Entry as user1', async function() {
    let res = await utils.createApi(user1, Utils.HTTPVerb.POST, '/v0/Stores')
      .send({name: 'store1', type: 'coffee Shop'})
      .expect(200);
    let ret = JSON.parse(res.text);
    storeEntryId = ret.id;
    assert.equal(ret.createdBy, user1);
    assert.equal(ret.modifiedBy, user1);
    return;
  });

  it('Mixin Modify a Store Entry as user2', async function() {
    let res = await utils.createApi(user2, Utils.HTTPVerb.PATCH, `/v0/Stores/${storeEntryId}`)
      .send({name: 'store1', type: 'coffee Shop.'})
      .expect(200);
    let ret = JSON.parse(res.text);
    assert.equal(ret.createdBy, user1);
    assert.equal(ret.modifiedBy, user2);
    return;
  });
});
