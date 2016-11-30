'use strict';

import debug = require('debug');
import loopback = require('loopback');
import Roles = require('../../common/models/model_roles');
import RoleModel = require('../../common/models/role.d');
import UserRoleModel = require('../../common/models/user-role-model.d');
import ErrorAuth = require('../../common/lib/error');

const log = debug('loopbackauth:RoleResolver');

module.exports = function(app: loopback.LoopBackApplication) {

  // Register Roles resolver
  Roles.ModelRoles.toArray().map((r) => {
    log(`Register role resolver for ${Roles.ModelRoles.toString(r)}`);
    return app.models.role.registerResolver(Roles.ModelRoles.toString(r), roleResolver);
  });

  // For each request the ACL are traversed
  // If there is a dynamic role in them, this function is called to check if the user is matching that role
  // This function returns TRUE if the role is matched
  // This function returns FALSE if the role is not matched
  async function roleResolver(enforcedRoleString: string, context: loopback.LoopbackContextObject): Promise<boolean> {
    const MATCH = true;
    const NOT_MATCH = false;

    // NOT MATCH if:
    // 1) there is not context
    // 2) the user is not authenticated
    if (!context || !context.accessToken.userId) {
      log(`roleResolver: ${enforcedRoleString} NOT_MATCH, there is no context or the user is not authenticated`);
      return NOT_MATCH;
    }

    let enforcedRole = Roles.ModelRoles.toModelRoles(enforcedRoleString);
    // Static checks
    // On the base of the request type and the method it is possible to state immediately if there is a match or not
    // this will save the lookup on the database
    switch (enforcedRole) {
      case Roles.ModelRoles.$model_viewer: {
        if (context.accessType === 'WRITE' || context.accessType === 'EXECUTE') {
          log(`roleResolver: ${enforcedRoleString} NOT_MATCH, ${enforcedRoleString} is now allowed to do ${context.accessType}`);
          return NOT_MATCH;
        }
        break;
      }
      case Roles.ModelRoles.$model_editor: {
        if (context.accessType === 'EXECUTE' || context.method === 'create' || context.method === 'deleteById') {
          log(`roleResolver: ${enforcedRoleString} NOT_MATCH, ${enforcedRoleString} is now allowed to do ${context.accessType} ` +
              `or ${context.method}`);
          return NOT_MATCH;
        }
        break;
      }
    }

    log(`roleResolver: ${enforcedRoleString}, userId: ${context.accessToken.userId} modelName: ${context.modelName} ` +
        `modelId:${context.modelId} accessType: ${context.accessType} method: ${context.method}`);

    let modelId: number | undefined = (enforcedRole === Roles.ModelRoles.$admin ||
                                       enforcedRole === Roles.ModelRoles.$model_admin) ?
                                       undefined : context.modelId;
    let modelName: string | undefined = (enforcedRole === Roles.ModelRoles.$admin) ? undefined : context.modelName;

    let userRoleModel: UserRoleModel.PersistedModelUserRoleModel = app.models.UserRoleModel;
    let count = await userRoleModel.count({
      userId: context.accessToken.userId,
      modelName: modelName,
      roleId: enforcedRole,
      modelId: modelId
    });
    log(`roleResolver: ${enforcedRoleString} ${count > 0 ? 'MATCH' : 'NOT_MATCH'}, ` +
        `userId: ${context.accessToken.userId} modeltype: ${context.modelName} modelId:${context.modelId}, count:${count}`);
    return count > 0; // true = is a MATCH
  } // end of role resolver

};
