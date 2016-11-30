declare module 'loopback-context' {

  export interface CurrentUser {
    id: number;
    realm: string;
    username: string;
    email: string;
  }

  export interface ContextAccessToken {
    id: number;
    ttl: number;
    created: Date;
    userId: number;
  }

  export interface Active {
      accessToken: ContextAccessToken;
      currentUser: CurrentUser;
  }

  export interface Id {
    flags: number;
    uid: number;
    data: null;
  }

  export interface LoopbackContext {
        active: Active;
        id: Id;
  }

}
