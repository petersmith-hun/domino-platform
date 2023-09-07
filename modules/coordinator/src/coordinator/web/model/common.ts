import { HttpStatus } from "@core-lib/platform/api/common";

/**
 * Supported OAuth scopes.
 */
export enum Scope {
    READ_INFO = "read:info",
    WRITE_DEPLOY = "write:deploy",
    WRITE_START = "write:start",
    WRITE_RESTART = "write:delete write:start",
    WRITE_DELETE = "write:delete",
    WRITE_UPLOAD = "write:upload"
}

/**
 * Wrapper class for controller responses. Contains the response status and the content of the response as T.
 *
 * @param <T> type of the response content
 */
export class ResponseWrapper<T> {

    readonly status: HttpStatus;
    readonly content?: T;

    constructor(status: HttpStatus, content?: T) {
        this.status = status;
        this.content = content;
    }
}

/**
 * Model class for constraint violation API responses.
 */
export interface ConstraintViolation {

    field: string;
    constraint: string;
    message: string;
}

/**
 * Model class for basic error API responses.
 */
export interface ErrorMessage {

    message: string;
}

/**
 * Model class for constraint violation error API responses.
 */
export interface ConstraintViolationErrorMessage extends ErrorMessage {

    violations: ConstraintViolation[];
}
