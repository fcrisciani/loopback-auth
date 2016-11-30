
// My model class
export class Version {
  public name: string;
  public version: string;
  public instanceStartTime: Date;
}

// Persisted instance type returned from the PersitedModel operations
export interface PersistedVersion extends Version, PersistedInstance<PersistedVersion> { }

// Persisted Model type used into the TS module file
export interface PersistedModelVersion extends PersistedModel<Version, PersistedModelVersion> {
  creationTime: Date;
  versionInfo(): Promise<PersistedModelVersion>;
}
