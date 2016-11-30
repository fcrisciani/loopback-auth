import Roles = require('./model_roles');

// My initializer
export interface RoleAuthData {
  name: string;
  roleId: Roles.ModelRoles;
}

// My model class
export class RoleAuth extends Role {
  constructor(data: RoleAuthData);
  public roleId: Roles.ModelRoles;
}

// Persisted instance type returned from the PersitedModel operations
export interface PersistedRoleAuth extends RoleAuth, PersistedInstance<PersistedRoleAuth> { }

// Persisted Model type used into the TS module file
export interface PersistedModelRoleAuth extends RoleAuth, PersistedModel<RoleAuthData, PersistedRoleAuth> { }
