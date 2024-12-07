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

/**
 * Error to be thrown when the requested deployment does not exist.
 */
export class UnknownDeploymentError extends GenericError {

    constructor(deploymentID: string) {
        super(`Requested application registration ${deploymentID} does not exist`);
    }
}

/**
 * Error to be thrown when the deployment definition to be imported is invalid.
 */
export class InvalidImportedDeploymentError extends GenericError {

    constructor(message: string) {
        super(message);
    }
}

/**
 * Error to be thrown when a deployment to be updated is locked.
 */
export class LockedDeploymentError extends GenericError {

    constructor(deploymentID: string) {
        super(`Deployment ${deploymentID} is locked`);
    }
}
