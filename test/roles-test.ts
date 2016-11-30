'use strict';
let assert = require('assert');
let phoenix = require('../server/phoenix');
import loopback = require('loopback');
import Utils = require('./utils/test-utils');
import Roles = require('../common/models/model_roles');

let utils = new Utils.TestUtils(phoenix);
let StoreEntryId: {[K: string]: number} = {};
const user1 = 'user-viewer';
const user2 = 'user-editor';
const user3 = 'user-owner';
const user4 = 'user-admin';
const user5 = 'user-none';
const users = [user1, user2, user3, user4, user5];
const stores = [{name: 'StoreTest', type: 'TestStore'}, {name: 'StoreHidden', type: 'TestStoreHidden'}];

describe('ROLE API Test Suite', function() {
  before(async function() {
    this.timeout(4000);
    await utils.startServer();
    phoenix.models.Store.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      // console.log('Remote Error detected on Store Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
    phoenix.models.user.afterRemoteError('**', function(ctx: loopback.LoopbackContextObject, next: (err?: string) => void) {
      // console.log('Remote Error detected on USER Api [' + ctx.error.message + ']');
      delete ctx.error.stack;
      next();
    });
    await utils.createUsers(users);
    await utils.loginUsers(users);

    // Use the admin user to create the Stores
    await utils.createStores('admin', stores);

    return;
  });

  after(async function() {
    await utils.flushUserRoles(true);
    await utils.logoutUsers();
    return;
  });

  it('Users has no right to read Stores', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(401);
      await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .expect(401);
      return utils.createApi(user, Utils.HTTPVerb.POST, '/v0/Stores')
        .send({name: 'StoreDenied', type: 'StoreDenied'})
        .expect(401);
    });
    await Promise.all(workers);

    return;
  });

  it('Admin assign user1 role of Viewers for StoreTest', async function() {
    // add the user1 as viewer of the Store created
    let res = await utils.assignUserRole('admin', user1, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    res = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
      .expect(200);

    // This for now will return 200 fetching only the stores for which we have a view permission
    // res = await utils.createApi(Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreHidden')}`)
    //   .expect(401);

    return;
  });

  it('User1 and Admin are the only ones that can read StoreTest', async function() {
    let workers = users.map(async (user) => {
      let res = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`);
      if (user === 'admin') {
        assert.equal(res.status, 200);
        let ret = JSON.parse(res.text);
        assert.equal(ret.length, 2);
      } else if (user === user1) {
        assert.equal(res.status, 200);
        let ret = JSON.parse(res.text);
        assert.equal(ret.length, 1);
        assert.equal(ret[0].id, utils.getStoreId('StoreTest'));
      } else {
        assert.equal(res.status, 401);
      }
    });
    await Promise.all(workers);

    return;
  });

  it('Users cannot access StoreHidden because do not have rights', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      let res = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreHidden')}`)
        .expect(401);

      if (user !== user1) {
        res = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
          .expect(401);
      }
    });
    await Promise.all(workers);

    return;
  });

  it('Users do not have right to create new Stores', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      await utils.createApi(user, Utils.HTTPVerb.POST, '/v0/Stores')
        .send({name: 'StoreDenied', type: 'StoreDenied'})
        .expect(401);
    });
    await Promise.all(workers);

    return;
  });

  it('Admin removes the Viewer priviledge to User1', async function() {
    // Revoke privilege to user1
    let res = await utils.revokeUserRole('admin', user1, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
      .expect(401);

    return;
  });

  it('Admin assign role of Editor to User1 for StoreTest', async function() {
    let res = await utils.assignUserRole('admin', user1, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    let res2 = await utils.createApi(user1, Utils.HTTPVerb.GET, '/v0/Stores')
      .expect(200);
    let ret = JSON.parse(res2.text);
    assert.equal(ret.length, 1);
    assert.equal(ret[0].id, utils.getStoreId('StoreTest'));

    return;
  });

  it('User1 as Editor can now READ,UPDATE but not CREATE/DELETE', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      if (user === user1) {
        await utils.createApi(user, Utils.HTTPVerb.PUT, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .send({name: 'StoreTest', type: 'TestUser1'})
        .expect(200);
        let res2 = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(200);
        let ret = JSON.parse(res2.text);
        assert.equal(ret.length, 1);
        assert.equal(ret[0].id, utils.getStoreId('StoreTest'));
        assert.equal(ret[0].type, 'TestUser1');
        await utils.createApi(user, Utils.HTTPVerb.POST, '/v0/Stores')
        .send({name: 'Store1', type: 'User1 write test'})
        .expect(401);
        await utils.createApi(user, Utils.HTTPVerb.DELETE, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .expect(401);
      } else {
        // other users cannot do anything
        await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(401);
        await utils.createApi(user, Utils.HTTPVerb.POST, '/v0/Stores')
        .send({name: 'Store1', type: 'User1 write test'})
        .expect(401);
        await utils.createApi(user, Utils.HTTPVerb.PUT, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .send({name: 'Store1', type: 'User1 write test'})
        .expect(401);
        await utils.createApi(user, Utils.HTTPVerb.DELETE, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .expect(401);
      }
    });
    await Promise.all(workers);

    return;
  });

  it('Users cannot change or assign new roles', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      let res = await utils.assignUserRole(user, user, Roles.ModelRoles.$admin, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user, Roles.ModelRoles.$model_admin, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
      assert.equal(res.status, 401);

      res = await utils.assignUserRole(user, user2, Roles.ModelRoles.$admin, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user2, Roles.ModelRoles.$model_admin, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user2, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
      res = await utils.assignUserRole(user, user2, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
      assert.equal(res.status, 401);
    });
    await Promise.all(workers);

    return;
  });

  it('Admin assign role of Owner to User1 for StoreTest', async function() {
    // Revoke privilege to user1
    let res = await utils.revokeUserRole('admin', user1, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
      .expect(401);

    res = await utils.assignUserRole('admin', user1, Roles.ModelRoles.$model_admin, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    let res2 = await utils.createApi(user1, Utils.HTTPVerb.GET, `/v0/Stores`)
      .expect(200);
    let ret = JSON.parse(res2.text);
    assert.equal(ret.length, 2);
    for (let store of ret) {
      if (store.name === 'StoreTest') {
        assert.equal(store.id, utils.getStoreId('StoreTest'));
        assert.equal(store.type, 'TestUser1');
      } else if (store.name === 'StoreHidden') {
        assert.equal(store.id, utils.getStoreId('StoreHidden'));
        assert.equal(store.type, 'TestStoreHidden');
      }
    }
    return;
  });

  it('User1 as Model administrator can now READ,UPDATE,CREATE,DELETE', async function() {
    let workers = users.map(async (user) => {
      if (user === 'admin')
        return;

      if (user === user1) {
        await utils.createApi(user, Utils.HTTPVerb.PUT, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .send({name: 'StoreTest', type: 'TestUser1'})
        .expect(200);

        await utils.createStores(user, [{name: 'StoreUser1', type: 'User1 write test'}]);

        let res2 = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(200);
        let ret = JSON.parse(res2.text);
        assert.equal(ret.length, 3);
        for (let store of ret) {
          if (store.name === 'StoreTest') {
            assert.equal(store.id, utils.getStoreId('StoreTest'));
            assert.equal(store.type, 'TestUser1');
          } else if (store.name === 'StoreUser1') {
            assert.equal(store.id, utils.getStoreId('StoreUser1'));
            assert.equal(store.type, 'User1 write test');
          } else {
            assert.equal(store.id, utils.getStoreId('StoreHidden'));
            assert.equal(store.type, 'TestStoreHidden');
          }
        }
        await utils.createApi(user, Utils.HTTPVerb.DELETE, `/v0/Stores/${utils.getStoreId('StoreUser1')}`)
          .expect(200);

        res2 = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
          .expect(200);
        ret = JSON.parse(res2.text);
      } else {
        // other users cannot do anything
        await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(401);

        await utils.createApi(user, Utils.HTTPVerb.POST, '/v0/Stores')
        .send({name: 'Store1', type: 'User1 write test'})
        .expect(401);

        await utils.createApi(user, Utils.HTTPVerb.PUT, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .send({name: 'Store1', type: 'User1 write test'})
        .expect(401);

        await utils.createApi(user, Utils.HTTPVerb.DELETE, `/v0/Stores/${utils.getStoreId('StoreTest')}`)
        .expect(401);
      }
    });
    await Promise.all(workers);

    return;
  });

  it('User1 as Owner can also assign roles', async function() {
    let res = await utils.assignUserRole(user1, user1, Roles.ModelRoles.$admin, 'Store', 'StoreTest');
    assert.equal(res.status, 401);
    res = await utils.assignUserRole(user1, user2, Roles.ModelRoles.$model_admin, 'Store', 'StoreTest');
    assert.equal(res.status, 204);
    res = await utils.assignUserRole(user1, user3, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
    assert.equal(res.status, 204);
    res = await utils.assignUserRole(user1, user4, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
    assert.equal(res.status, 204);

    let workers = users.map(async (user) => {
      if (user === 'admin' || user === user1)
        return;

     if (user === user2) {
        let res2 = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`);
        assert.equal(res2.status, 200);
        let ret = JSON.parse(res2.text);
        assert.equal(ret.length, 2);
        for (let store of ret) {
          if (store.name === 'StoreTest') {
            assert.equal(store.id, utils.getStoreId('StoreTest'));
            assert.equal(store.type, 'TestUser1');
          } else {
            assert.equal(store.id, utils.getStoreId('StoreHidden'));
            assert.equal(store.type, 'TestStoreHidden');
          }
        }
      } else if (user === user3 || user === user4) {
        // User1, User2, User3, User4 are now all able to READ
        let res2 = await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`);
        assert.equal(res2.status, 200);
        let ret = JSON.parse(res2.text);
        assert.equal(ret.length, 1);
        assert.equal(ret[0].id, utils.getStoreId('StoreTest'));
      } else {
        // User5 is still with no rights
        await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
          .expect(401);
      }
    });
    await Promise.all(workers);

  });

  it('User1 as Owner can also revoke roles', async function() {
    let res = await utils.revokeUserRole(user1, user1, Roles.ModelRoles.$admin, 'Store', 'StoreTest');
    assert.equal(res.status, 401);
    res = await utils.revokeUserRole(user1, user2, Roles.ModelRoles.$model_admin, 'Store', 'StoreTest');
    assert.equal(res.status, 204);
    res = await utils.revokeUserRole(user1, user3, Roles.ModelRoles.$model_editor, 'Store', 'StoreTest');
    assert.equal(res.status, 204);
    res = await utils.revokeUserRole(user1, user4, Roles.ModelRoles.$model_viewer, 'Store', 'StoreTest');
    assert.equal(res.status, 204);
    let workers = users.map(async (user) => {
      if (user === 'admin' || user === user1)
        return;

      // User losts all their rights
      await utils.createApi(user, Utils.HTTPVerb.GET, `/v0/Stores`)
        .expect(401);
    });
    await Promise.all(workers);

    return;
  });

  it('Check Access to Store - admin', async function() {
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
