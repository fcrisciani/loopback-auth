'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import loopback = require('loopback');
import Utils = require('./utils/test-utils');
import Roles = require('../common/models/model_roles');

let utils = new Utils.TestUtils(phoenix);
let StoreEntryId: {[K: string]: number} = {};
const user1 = 'user-mt1';
const user2 = 'user-mt2';
const users = [user1, user2];
const stores = [{name: `Store${user1}`, type: `${user1}`},
                {name: `Store${user2}`, type: `${user2}`}];

describe('REST API MultiTenant Test Suite', function() {
  before(async function() {
    await utils.startServer();
    phoenix.models.Store.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      console.log('Remote Error detected on Store Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
    await utils.createUsers(users);
    await utils.loginUsers(users);

    // Use the admin user to create the Stores
    await utils.createStores('admin', stores);

    /*
    MultiTenancy is going to fail as it's not supported by loopback
     Support for multitenancy needs to be added in the infra
     For reference look at https://github.com/ShoppinPal/multi-tenant-loopback-example
     Notes:-
     VD will have a automatic VD ROLES (VD ADMIN, VD Viewer, VD Editor etc).
     Users will belong to one of the VD Roles. (Table to map User to VD-Roles)
     When a user logins only show the VD's that he has access to by reading VD-Role Table which has user list for each VD.

     //A table with list of VDid as key and list of users that are part of the VD with information about the permission types or ROLES .
     // VD Creation should create the current user as the VD admin.
     // Additional API's should be provided to add and remove users form VD access
     */
    return;
  });

  after(async function() {
    await utils.flushUserRoles();
    await utils.logoutUsers();
    return;
  });

  it('Validate viewer privileges assignment', async function() {
    // Assign viewer privileges to user1 and user2 respectively on different stores
    for (let user of users) {
      if (user === 'admin')
        continue;
      // add the user as viewer of the Store created
      let res = await utils.assignUserRole('admin', user, Roles.ModelRoles.$model_viewer, 'Store', `Store${user}`);
      assert.equal(res.status, 204);
    }
  });

  it('check Access to Store - user1', async function() {
    let res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId(`Store${user1}`)}`)
      .expect(200);
    let ret = JSON.parse(res.text);
    assert.equal(ret.id, utils.getStoreId(`Store${user1}`));
    // assert.equal(ret.createdBy, user1);
    // assert.equal(ret.modifiedBy, user1);

    // User 1 should not have access to user2 created entry.
    res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId(`Store${user2}`)}`)
      .expect(401);

    return;
  });

  it('check Access to Store - user2', async function() {
    let res = await utils.createApi(user2, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId(`Store${user2}`)}`)
      .expect(200);
    let ret = JSON.parse(res.text);
    assert.equal(ret.id, utils.getStoreId(`Store${user2}`));
    // assert.equal(ret.createdBy, user1);
    // assert.equal(ret.modifiedBy, user1);

    // User 1 should not have access to user2 created entry.
    res = await utils.createApi(user2, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId(`Store${user1}`)}`)
      .expect(401);

    return;
  });

  it('Validate viewer privileges revoke', async function() {
    // Assign viewer privileges to user1 and user2 respectively on different stores
    for (let user of users) {
      if (user === 'admin')
        continue;
      // add the user as viewer of the Store created
      let res = await utils.assignUserRole('admin', user, Roles.ModelRoles.$model_viewer, 'Store', `Store${user}`);
      assert.equal(res.status, 204);
    }
  });


  it('check Access to Store - admin', async function() {
    // Admin should be able to access both
    let res = await utils.createApi('admin', Utils.HTTPVerb.GET, `/v0/Stores`)
      .expect(200);
    let ret = JSON.parse(res.text);
    // there has to be 2 Stores
    assert.equal(ret.length, 2);
    // varify the 2 Stores
    for (let store of ret) {
      assert.equal(store.id, utils.getStoreId(store.name));
    }

    return;
  });

});
