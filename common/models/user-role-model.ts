'use strict';

import debug = require('debug');
import UserRoleModel = require('./user-role-model.d');
import Roles = require('./model_roles');
import ErrorAuth = require('../../common/lib/error');

const log = debug('loopbackauth:UserRoleModel');

module.exports = function(userRoleModel: UserRoleModel.PersistedModelUserRoleModel) {

  userRoleModel.getUserRole = async (userId: number, modelName?: string, modelId?: number): Promise<Roles.ModelRoles> => {
    let query_result: Array<UserRoleModel.UserRoleModel> = [];
    /* The following code has to cover 3 cases:
     * 1) Viewer or Editor: this user has an entry in table per modelName and modelId and the associated role for it
     * 2) Owner: this user has an entry in the table per modelName
     * 3) Admin: this user has only one entry in the table
     * Worst case there will be 3 lookups, these can be reduce on the base of the parameters passed to the function
     * e.g. if you search for an Admin role, pass only the userId and ther will be only 1 lookup
     */
    let filter: QueryFilter = {};
    filter.order = 'userId ASC';
    if (modelName !== undefined && modelId !== undefined) {
      // Aim for a viewer or editor
      filter.where = {};
      filter.where.and = [{userId: userId}, {modelName: modelName}, {modelId: modelId}];
      query_result =  await userRoleModel.find(filter);
    }

    if (query_result.length === 0 && modelName !== undefined) {
      // Aim for a owner
      filter.where = {};
      filter.where.and = [{userId: userId}, {modelName: modelName}];
      query_result =  await userRoleModel.find(filter);
    }

    if (query_result.length === 0) {
      // Aim for admin
      filter.where = {};
      filter.where.and = [{userId: userId}];
      query_result =  await userRoleModel.find(filter);
    }

    log(`getUserRole: fetched ${query_result.length} roles for user: ${userId}`);
    if (query_result.length === 0) {
      let errorMsg = `getUserRole: ${userId} has no role assigned for the model ${modelName}`;
      log(errorMsg);
      throw new ErrorAuth.UnauthorizedError(errorMsg);
    }

    // TODO is it possible that there is more than 1 role?
    log(`getUserRole: returning the ${query_result[0].roleId}`);
    return query_result[0].roleId;
  };

};
