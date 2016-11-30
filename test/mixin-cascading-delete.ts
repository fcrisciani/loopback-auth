'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import loopback = require('loopback');
import Utils = require('./utils/test-utils');
import Roles = require('../common/models/model_roles');

let utils = new Utils.TestUtils(phoenix);
let storeEntryId: number;
const user1 = 'mixin-cd';
const users = [user1];
let storeId: number;
let reviewerId: number;
let reviewId: number;
let commentId: number;

describe('Cascading Delete', function() {
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
    // create a store
    let res = await utils.createApi(user1, Utils.HTTPVerb.POST, '/v0/Stores')
      .send({name: 'store1', type: 'coffee Shop'})
      .expect(200);
    storeId = JSON.parse(res.text).id;
    // create a Reviewer
    res = await utils.createApi(user1, Utils.HTTPVerb.POST, '/v0/Reviewers')
      .send({name: 'reviewer1'})
      .expect(200);
    reviewerId = JSON.parse(res.text).id;
    // Post a Review
    res = await utils.createApi(user1, Utils.HTTPVerb.POST, '/v0/Reviews')
      .send({'rating': 4, 'storeId': storeId, 'publisherId': reviewerId})
      .expect(200);
    reviewId = JSON.parse(res.text).id;
    // add a comment text
    res = await utils.createApi(user1, Utils.HTTPVerb.POST, `/v0/Reviews/${reviewId}/comment`)
      .send({'text': 'great place!'})
      .expect(200);
    commentId = JSON.parse(res.text).id;
    /*
     A Mixin can be added as a cascading delete mixin,
     have to make sure it handles the relationship generically.
     https://github.com/senorcris/loopback-cascade-delete-mixin/blob/master/lib/cascade-delete.js
     */
    this.skip(); // Comment OUT This to make the test Active.
    return;
  });

  after(async function() {
    utils.logoutUsers();
    return;
  });

  it('Delete the Reviewer', async function() {
    // delete the reviewer
    let res = await utils.createApi(user1, Utils.HTTPVerb.DELETE, `/v0/Reviews/${reviewId}`)
      .expect(200);
    let ret = JSON.parse(res.text);
    assert.equal(ret.count, 1); // should this be one ?
    return;
  });

  it('check if Reviewer deleted', async function() {
    // delete the reviewer
    let res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Reviews/${reviewId}`)
      .expect(404);
    return;
  });

  it('check if Review deleted', async function() {
    // delete the reviewer
    let res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Reviews/${reviewId}`)
      .expect(404);
    return;
  });

  it('check if Comment deleted', async function() {
    // delete the reviewer
    let res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Comments/${commentId}`)
      .expect(404);
    return;
  });
});
