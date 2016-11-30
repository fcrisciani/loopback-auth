'use strict';

import debug = require('debug');
import loopback = require('loopback');
import UserModel = require('../../common/models/user.d');
import Roles = require('../../common/models/model_roles');
import RoleModel = require('../../common/models/role.d');
import UserRoleModel = require('../../common/models/user-role-model.d');

const log = debug('loopbackauth:BootBaseUser');
const ADMIN_USER: UserModel.UserAuthData = {username: 'admin', email: 'admin@example.com', password: 'loopbackauth'};

module.exports = async function(app: loopback.LoopBackApplication) {
  let userModel: UserModel.PersistedModelUserAuth = app.models.user;
  let roleModel: RoleModel.PersistedModelRoleAuth = app.models.role;
  let userRoleModel: UserRoleModel.PersistedModelUserRoleModel = app.models.UserRoleModel;

  // Roles creation
  let workers = Roles.ModelRoles.toArray().map((role: Roles.ModelRoles) => {
     return roleModel.findOrCreate(
       {where: {roleId: role}},
       {name: Roles.ModelRoles.toString(role), roleId: role});
  });

  // Initialize Roles if needed
  let result = await Promise.all(workers);
  result.map(([role, created]) => {
    if (created)
      log(`Created role: ${JSON.stringify(role)}`);
  });

  // Admin user creation
  let [user, user_created] = await userModel.findOrCreate(ADMIN_USER);
  if (user_created)
    log(`Created admin user: ${JSON.stringify(user)}`);

  // Set administrative role to Admin user
  let [role, role_created] = await userRoleModel.findOrCreate({userId: user.id, roleId: Roles.ModelRoles.$admin});
  if (role_created)
    log(`Created user-role-project: ${JSON.stringify(role)}`);
};
