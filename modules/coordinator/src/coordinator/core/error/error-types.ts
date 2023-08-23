/**
 * Basic error class.
 */
export class GenericError extends Error {

    constructor(message: string) {
        super(message);
    }
}

/**
 * Error class for direct authentication/authorization related errors.
 */
export class DirectAuthError extends GenericError {

    constructor(message: string) {
        super(message);
    }
}
