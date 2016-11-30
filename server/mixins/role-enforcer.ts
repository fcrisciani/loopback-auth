'use strict';

/*
 A mixin for enforcing roles on methods
-> Access hook: the access hook methods is called for every operation related to data access before the
                database operation happens. On the base of the user priviledge create a filter in order
                to fetch only the domain related entries that the user is allowed to access.
                More info here: http://loopback.io/doc/en/lb3/Operation-hooks-version-3.0.html
 */
import debug = require('debug');
import loopback = require('loopback');
import loopbackcontext = require ('loopback-context');
import Roles = require('../../common/models/model_roles');
import UserRoleModel = require('../../common/models/user-role-model.d');
import ErrorAuth = require('../../common/lib/error');

const loopbackContext = require('loopback-context');
const app = require('../phoenix');
const log = debug('loopbackauth:RoleEnforcer');

module.exports = function (Model: DataSource, options: loopback.MixinOptions) {

  // for more information on when this callback is invoked check:
  // http://loopback.io/doc/en/lb3/Operation-hooks-version-3.0.html
  Model.observe('access', async (ctx): Promise<void> => {
    let filter = await getAccessFilter(ctx.Model.modelName);
    log(`access mixin: Query filter attached: ${JSON.stringify(filter)}`);
    // assign the new query filter
    // TODO the query cannot be simply rewritten but has to be merged with the query if any
    // the risk is also that from outside the user pass a query that is not allowed
    if (filter.hasOwnProperty('where')) {
      ctx.query = filter;
    }
    return;
  });

  async function getAccessFilter(modelName: string): Promise<QueryFilter> {
    let context: loopbackcontext.LoopbackContext = loopbackContext.getCurrentContext();
    let query_result: Array<UserRoleModel.UserRoleModel>;
    /* The following query covers 2 cases:
     * 1) Admin user: this is the administrator of the system so it has only the mapping userId with the role admin
     * 2) Normal user: this user has an entry in table per modelName and modelId and the associated role for it
     */
    let filter: QueryFilter = {
      where: {
        or: [
          // Admin user, Admin has only a mapping userId,RoleId
          {and: [{userId: context.active.currentUser.id}, {roleId: Roles.ModelRoles.$admin}]},
          // Normal user, Normal user has a mapping userId,RoleId,ModelName,ModelId
          {and: [{userId: context.active.currentUser.id}, {modelName: modelName},
                 {or: [
                   {roleId: Roles.ModelRoles.$model_admin},
                   {roleId: Roles.ModelRoles.$model_editor},
                   {roleId: Roles.ModelRoles.$model_viewer} ]}]}
        ]
      }
    };
    let userRoleModel: UserRoleModel.PersistedModelUserRoleModel = app.models.UserRoleModel;
    query_result =  await userRoleModel.find(filter);

    filter = {};
    if (query_result.length === 0) {
      let errorMsg = `getAccessFilter: The user:${context.active.currentUser.username}[id:${context.active.currentUser.id}], ` +
                     `is not allowed to read any entry on ${modelName}`;
      log(errorMsg);
      throw new ErrorAuth.UnauthorizedError(errorMsg);
    }

    if (query_result[0].roleId !== Roles.ModelRoles.$admin &&
        query_result[0].roleId !== Roles.ModelRoles.$model_admin) {
      filter.where = {};
      filter.where.or = [];
      for (let model of query_result) {
        filter.where.or.push({'id': model.modelId});
      }
    }
    log(`getAccessFilter: role checking called for user:${context.active.currentUser.username}[id:${context.active.currentUser.id}] ` +
        `filter: ${JSON.stringify(filter)}`);

    return filter;
  };
};
