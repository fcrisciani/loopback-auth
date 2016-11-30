
// My model class
export class Store {
  public name: string;
  public type: string;
}

// Persisted instance type returned from the PersitedModel operations
export interface PersistedStore extends Store, PersistedInstance<PersistedStore> { }

// Persisted Model type used into the TS module file
export class PersistedModelStore extends PersistedModel<Store, PersistedModelStore> { }
