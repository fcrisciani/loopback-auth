'use strict';

export class ErrorApi extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends ErrorApi {
  public status: number;
  constructor(message: string) {
    super(401, message);
  }
}
