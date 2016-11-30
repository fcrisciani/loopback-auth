'use strict';

let request = require('supertest');
let lbBoot = require('loopback-boot');
let rpath = require('path');
import * as express from 'express';
import loopback = require('loopback');
import Roles = require('../../common/models/model_roles');
import StoreModel = require('../test-models/store.d');

interface UserRoleMapping {
  userName: string;
  role: number;
  modelName: string;
  modelIdentifier: string;
}

export enum HTTPVerb {
  GET = 1,
  PUT,
  POST,
  PATCH,
  UPDATE,
  DELETE
}

export namespace HTTPVerb {
  export function toString(v: HTTPVerb): string {
    return HTTPVerb[v].toLowerCase();
  }
}

export class TestUtils {
  constructor(app: loopback.LoopBackApplication) {
    this.app_ = app;
  }
  private authToken_: string = '';
  private users_: Array<string> = [];
  private userId_: {[K: string]: number} = {};
  private userAuthTokenMap_: {[K: string]: string} = {};
  private stores_: {[K: string]: number} = {};
  private rolesAssigned_: {[K: string]: Array<UserRoleMapping>} = {};
  private app_: loopback.LoopBackApplication;

  // create a password for the user provided
  public getUserPassword(user: string): string {
    if (user === 'admin') {
      return 'loopbackauth';
    }
    return user + '_secret';
  }

  // create the login for users listed in userList
  public async createUsers(userList: Array<string>): Promise<void> {
    this.users_ = userList;
    let workers = userList.map((user) => {
      return this.createApi(user, HTTPVerb.POST, '/v0/users')
        .send({username: user, password: this.getUserPassword(user), realm: 'admin', email: user + '@example.com'})
        .expect(200);
    });
    let result = await Promise.all(workers);
    result.map((res, index) => {
      let userCreated = JSON.parse(res.text);
      this.userId_[userCreated.username] = userCreated.id;
    });
  }

  // create the domain specified in the list
  public async createStores(user: string, storeList: Array<StoreModel.Store>): Promise<void> {
    let workers = storeList.map((store) => {
      return this.createApi(user, HTTPVerb.POST, '/v0/Stores')
        .send({name: store.name, type: store.type})
        .expect(200);
    });
    let result = await Promise.all(workers);
    result.map((res) => {
      let storeCreated = JSON.parse(res.text);
      this.stores_[storeCreated.name] = storeCreated.id;
    });
  }

  // add a role to a specific user
  public async assignUserRole(fromUser: string, toUser: string, role: Roles.ModelRoles, modelName: string, modelIdentifier: string) {
    let res = await this.createApi(fromUser, HTTPVerb.POST, `/v0/users/${this.getUserId(toUser)}/AssignRole`)
      .send({roleId: role, modelName: modelName, modelId: this.stores_[modelIdentifier]});
    if (res.status === 204) {
      if (!this.rolesAssigned_.hasOwnProperty(toUser)) {
        this.rolesAssigned_[toUser] = [];
      }
      this.rolesAssigned_[toUser].push({userName: toUser, role: role, modelName: modelName, modelIdentifier: modelIdentifier});
    }
    return res;
  }

  // revoke a role to a specific user
  public async revokeUserRole(fromUser: string, toUser: string, role: Roles.ModelRoles, modelName: string, modelIdentifier: string) {
    let res = await this.createApi(fromUser, HTTPVerb.POST, `/v0/users/${this.getUserId(toUser)}/RevokeRole`)
      .send({roleId: role, modelName: modelName, modelId: this.stores_[modelIdentifier]});

    if (res.status === 204) {
      this.rolesAssigned_[toUser] = this.rolesAssigned_[toUser].filter(
        function(elem: UserRoleMapping) {
          return (elem.userName !== this.userName ||
                  elem.role !== this.role ||
                  elem.modelName !== this.modelName ||
                  elem.modelIdentifier !== this.modelIdentifier);
        }, {userName: toUser, role: role, modelName: modelName, modelIdentifier: modelIdentifier});
    }
    return res;
  }

  // revoke all roles of the users
  public async flushUserRoles(removeAdmin = false): Promise<void> {
    for (let user of this.users_) {
      if (user === 'admin' && !removeAdmin)
        continue;
      if (this.rolesAssigned_.hasOwnProperty(user)) {
        for (let userRole of this.rolesAssigned_[user]) {
          this.revokeUserRole('admin', user, userRole.role, userRole.modelName, userRole.modelIdentifier);
        }
      }
    }
  }

  // get if for an user
  public getUserId(user: string): number {
    return this.userId_[user];
  }

  public getStoreId(storeName: string): number {
    return this.stores_[storeName];
  }

  // login a set of users and store there auth ids
  public async loginUsers(userList: Array<string>): Promise<void> {
    // Add admin and login it
    this.users_.push('admin');
    let workers = this.users_.map(async (user) => {
      let res = await this.createApi(user, HTTPVerb.POST, '/v0/users/login')
        .send({username: user, password: this.getUserPassword(user)})
        .expect(200);
      this.userAuthTokenMap_[user] = JSON.parse(res.text).id;
    });
    await Promise.all(workers);
  }

  // logout a specific user
  private async logoutOneUser(user: string): Promise<void> {
    let res = await this.createApi(user, HTTPVerb.POST, '/v0/users/logout')
      .expect(204);
    return res;
  }

  // logoug a set of users or all users is no argument provided
  public async logoutUsers(user?: string | Array<string>) {
    if (typeof user === 'string') {
      return this.logoutOneUser(user);
    } else if (typeof user === 'object') {
      for (let tuser of user) {
        await this.logoutOneUser(tuser);
      }
    } else {
      for (let tuser of this.users_) {
        await this.logoutOneUser(tuser);
      }
      return;
    }
  }

  // set the current auth token
  public setUserAuthToken(user: string, auth: string): void {
    this.userAuthTokenMap_[user] = auth;
  }

  // start the loopback server
  public startServer(done?: (err: string) => void): void {
    let serverOptions = {
      'appRootDir': rpath.resolve(__dirname, '../../server'),
      'env': 'test'
    };
    // server should use the test models and the server runtime env is 'test'
    lbBoot(this.app_, serverOptions, function(err: string) {
      if (err) throw err;
    });
    let app = this.app_;
    if (app.loaded) {
      app.once('started', done);
      app.start();
    } else {
      app.once('loaded', function() {
        app.once('started', done);
        app.start();
      });
    }
  }

  // create an api calls for loopback server.
  public createApi(user: string | null, verb: HTTPVerb, url: string) {
    if (user) {
      return request(this.app_)[HTTPVerb.toString(verb)](url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .query({'access_token': this.userAuthTokenMap_[user]})
        .expect('Content-Type', /json/);
    } else {
      return request(this.app_)[HTTPVerb.toString(verb)](url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);
    }
  }
};
