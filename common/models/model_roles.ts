'use strict';
// This files cover the available roles that are going to be used once the RoleEnforcer mixin is activated
// Following there is a description of the characteristic and permission of each role.

// Split the remote methods as:
// 1) $admin: this is the Administrator, think of it like the root user. This role allows all the operation on all the models.
//            Permission: CREATE/READ/UPDATE/DELETE and ROLE_ASSIGNEMENT on ALL the models.
//
// 2) $model_admin: this is the Model Administrator, this type of user has full power on the model that has assigned.
//                  Permission: CREATE/READ/UPDATE/DELETE and ROLE_ASSIGNEMENT on the specific model owned.
//
// 3) $model_editor: this is the Model Editor, as the name suggests this role allows READ/UPDATE on the model instances that
//                   has assigned.
//                   Permission: READ/UPDATE on the specific model instances assigned
//
// 4) $model_viewer: this is the Model Viewer, as the name suggests this role allows uniquely the READ permission on the model
//                   instances assigned.
//                   Permission: READ on the specific model instaces assigned


// Example:
// The system when it boots has an $admin user preconfigured, that is the user that has to be used to start assigning roles.
//
// Let's consider this scenario:
// Model TestMdl: we have inside this Model 3 instances: [Test1, Test2, Test3]
// Users on the system:
//   - Admin: is $admin
//   - UserA: $model_admin
//   - UserB: $model_editor for Test1
//   - UserC: $model_viewer for Test2
//   - UserD: no role assigned
//
// Let's now breakdown the Permission and see the users that will be able to execute operations:
// READ operations:
// -> Test1: Admin as administrator, UserA as model administrator, UserB as editor of the specific Test1 object
// -> Test2: Admin as administrator, UserA as model administrator, UserC as viewer of the specific Test1 object
// -> Test3: Admin as administrator, UserA as model administrator
//
// CREATE/DELETE operation:
// Create and Delete will be allowed only to Admin and UserA, moreover both these 2 users have the right to assign roles to the users
// on the newly created objects. They are also the only 2 entitled to revoke roles to users.
//
// UPDATE operation:
// -> Test1: Admin as administrator, UserA as model administrator, UserB as editor of the specific Test1 object
// -> Test2: Admin as administrator, UserA as model administrator
// -> Test3: Admin as administrator, UserA as model administrator
// You can notice how UserC this time is not allowed to operate modification because is only a $model_viewer

export enum ModelRoles {
  $none = 1,            // no role found
  $admin = 2,           // administrator rights, can do everything
  $model_admin = 3,     // model admin, car WRITE/READ and assign roles for a specific model
  $model_editor = 4,    // model editor, can WRITE (only UPDATE) (http://loopback.io/doc/en/lb2/Controlling-data-access.html)
  $model_viewer = 5,    // model viewer, can READ (http://loopback.io/doc/en/lb2/Controlling-data-access.html)
}

export namespace ModelRoles {
  export function* getRoles() {
      yield ModelRoles.$admin;
      yield ModelRoles.$model_admin;
      yield ModelRoles.$model_editor;
      yield ModelRoles.$model_viewer;
  }

  export function toArray(): Array<ModelRoles> {
    return [ModelRoles.$admin, ModelRoles.$model_admin, ModelRoles.$model_editor, ModelRoles.$model_viewer];
  }

  export function toModelRoles(s: string): ModelRoles {
    let r: ModelRoles;
    switch (s) {
      case '$admin':
        r = ModelRoles.$admin;
        break;
      case '$model_admin':
        r = ModelRoles.$model_admin;
        break;
      case '$model_editor':
        r = ModelRoles.$model_editor;
        break;
      case '$model_viewer':
        r = ModelRoles.$model_viewer;
        break;
      default:
        r = ModelRoles.$none;
    }

    return r;
  }

  export function toString(m: ModelRoles | number): string {
    return ModelRoles[m];
  }
}
