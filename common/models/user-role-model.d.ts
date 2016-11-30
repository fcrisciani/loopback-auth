import Roles = require('./model_roles');

// My model class
export class UserRoleModel {
  public id?: id;
  public userId: number;
  public roleId: Roles.ModelRoles;
  public modelName?: string;
  public modelId?: number;
}

// Persisted instance type returned from the PersitedModel operations
export interface PersistedUserRoleModel extends UserRoleModel, PersistedInstance<PersistedUserRoleModel> { }

// Persisted Model type used into the TS module file
export interface PersistedModelUserRoleModel extends PersistedModel<UserRoleModel, PersistedUserRoleModel> {
  // getUserRoles(userId: number): Promise<Array<UserRoleModel>>;
  // isUserAdmin(userId: number): Promise<boolean>;
  // isUserModelAdmin(userId: number, modelName: string): Promise<boolean>;
  // isUserEditor(userId: number, modelName: string, modelId: number): Promise<boolean>;
  // isUserViewer(userId: number, modelName: string, modelId: number): Promise<boolean>;
  getUserRole(userId: number, modelName?: string, modelId?: number): Promise<Roles.ModelRoles>;
}
