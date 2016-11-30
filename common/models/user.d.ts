import Roles = require('./model_roles');

// My initializer
export interface UserAuthData {
  username: string;
  email: string;
  password: string;
}

// My model class
export class UserAuth extends User { }

// Persisted instance type returned from the PersitedModel operations
export interface PersistedUserAuth extends UserAuth, PersistedInstance<PersistedUserAuth> { }

// Persisted Model type used into the TS module file
export interface PersistedModelUserAuth extends PersistedModel<UserAuthData, PersistedUserAuth> {
  assignRole(userId: number, roleId: Roles.ModelRoles, modelName: string, modelId: number, cb: Function): void;
  revokeRole(userId: number, roleId: Roles.ModelRoles, modelName: string, modelId: number, cb: Function): void;
}
