'use strict';

import debug = require('debug');
import loopbackcontext = require ('loopback-context');
import UserModel = require('../../common/models/user.d');
import Roles = require('../../common/models/model_roles');
import RoleModel = require('../../common/models/role.d');
import UserRoleModel = require('../../common/models/user-role-model.d');
import ErrorAuth = require('../lib/error');

const app = require('../../server/phoenix');
const loopbackContext = require('loopback-context');
const log = debug('loopbackauth:UserModel');

module.exports = function(User: UserModel.PersistedModelUserAuth) {

  // Check if the current user role is higher enough for the role change operations
  async function isOperationAllowed(roleId: Roles.ModelRoles, modelName: string, modelId: number): Promise<void> {
    let context: loopbackcontext.LoopbackContext = loopbackContext.getCurrentContext();
    let roleModel: RoleModel.PersistedModelRoleAuth = app.models.Role;
    let currentUserRole = await app.models.UserRoleModel.getUserRole(context.active.currentUser.id, modelName, modelId);
    let requestedRole = Roles.ModelRoles[roleId];
    if (currentUserRole > Roles.ModelRoles.$model_admin || currentUserRole > Roles.ModelRoles.toModelRoles(requestedRole)) {
      let errorMsg = `User ${context.active.currentUser.username}[id:${context.active.currentUser.id}] with role ` +
                     `${Roles.ModelRoles.toString(currentUserRole)}[id:${currentUserRole}] ` +
                     `not allowed to set role ${requestedRole}[id:${Roles.ModelRoles.toModelRoles(requestedRole)}]`;
      log(errorMsg);
      throw new ErrorAuth.UnauthorizedError(errorMsg);
    }
  }

  User.assignRole = async function(userId: number, roleId: Roles.ModelRoles, modelName: string, modelId: number) {
    await isOperationAllowed(roleId, modelName, modelId);

    let userRoleModel: UserRoleModel.PersistedModelUserRoleModel = app.models.UserRoleModel;
    let [mapping, created] = await userRoleModel.findOrCreate({userId: userId, roleId: roleId, modelName: modelName, modelId: modelId});
    if (created)
      log(`assignRole: SUCCESS: ${JSON.stringify(mapping)}`);
  };

  User.remoteMethod(
    'assignRole',
    {
      http: {path: '/:id/AssignRole'},
      accepts: [
        {arg: 'id', type: 'number', required: true},
        {arg: 'roleId', type: 'number', required: true},
        {arg: 'modelName', type: 'string'},
        {arg: 'modelId', type: 'number'}
      ]
    }
  );

  User.revokeRole = async function(userId: number, roleId: Roles.ModelRoles, modelName: string, modelId: number) {
    await isOperationAllowed(roleId, modelName, modelId);

    let userRoleModel: UserRoleModel.PersistedModelUserRoleModel = app.models.UserRoleModel;
    let resultList = await userRoleModel.find(
      {where: {and: [{userId: userId}, {roleId: roleId}, {modelName: modelName}, {modelId: modelId}]}}
    );
    log(`removeRole: found ${resultList.length} entries`);
    let workers = resultList.map((mapping) => {
      return userRoleModel.destroyById(mapping.id);
    });
    await Promise.all(workers);
  };

  User.remoteMethod(
    'revokeRole',
    {
      http: {path: '/:id/RevokeRole'},
      accepts: [
        {arg: 'id', type: 'number', required: true},
        {arg: 'roleId', type: 'number', required: true},
        {arg: 'modelName', type: 'string'},
        {arg: 'modelId', type: 'number'}
      ]
    }
  );

  // Hide not useful methods
  User.disableRemoteMethodByName('upsert', true);
  User.disableRemoteMethodByName('updateAll', true);
  User.disableRemoteMethodByName('updateAttributes', false);

  // User.disableRemoteMethodByName('find', true);
  // User.disableRemoteMethodByName('findById', true);
  // User.disableRemoteMethodByName('findOne', true);

  User.disableRemoteMethodByName('deleteById', true);

  User.disableRemoteMethodByName('confirm', true);
  User.disableRemoteMethodByName('count', true);
  User.disableRemoteMethodByName('exists', true);
  User.disableRemoteMethodByName('resetPassword', true);

  // app.models.User.disableRemoteMethodByName('__count__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__create__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__delete__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__destroyById__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__findById__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__get__accessTokens', false);
  // app.models.User.disableRemoteMethodByName('__updateById__accessTokens', false);

  // Relation related
  User.disableRemoteMethodByName('__get__UserRoles', false);

};
