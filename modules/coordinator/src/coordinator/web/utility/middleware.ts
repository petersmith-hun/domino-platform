import {
    ConflictingSecretError,
    DirectAuthError,
    InvalidImportedDeploymentError,
    LockedDeploymentError,
    MissingSecretError,
    NonRetrievableSecretError,
    UnknownDeploymentError
} from "@coordinator/core/error/error-types";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { ConstraintViolationErrorMessage, ErrorMessage } from "@coordinator/web/model/common";
import { HttpStatus } from "@core-lib/platform/api/common";
import LoggerFactory from "@core-lib/platform/logging";
import { NextFunction, Request, Response } from "express";
import { InsufficientScopeError, InvalidTokenError, UnauthorizedError } from "express-oauth2-jwt-bearer";
import { v4 as UUID } from "uuid";

const logger = LoggerFactory.getLogger("ErrorHandlerMiddleware");

/**
 * Error type to HTTP status mapping.
 */
const errorStatusMap = new Map<string, HttpStatus>([
    [InvalidRequestError.name, HttpStatus.BAD_REQUEST],
    [InvalidImportedDeploymentError.name, HttpStatus.BAD_REQUEST],
    [LockedDeploymentError.name, HttpStatus.CONFLICT],
    [UnknownDeploymentError.name, HttpStatus.NOT_FOUND],
    [UnauthorizedError.name, HttpStatus.FORBIDDEN],
    [InsufficientScopeError.name, HttpStatus.FORBIDDEN],
    [InvalidTokenError.name, HttpStatus.FORBIDDEN],
    [DirectAuthError.name, HttpStatus.FORBIDDEN],
    [MissingSecretError.name, HttpStatus.NOT_FOUND],
    [NonRetrievableSecretError.name, HttpStatus.BAD_REQUEST],
    [ConflictingSecretError.name, HttpStatus.CONFLICT]
]);

/**
 * Error handler middleware for Express.
 * Generates and sends an error response model, along with setting the response status based on the received error type.
 *
 * @param error thrown error object
 * @param _request Express Request object
 * @param response Express Response object
 * @param _next Express next function
 */
export const errorHandlerMiddleware = (error: Error, _request: Request, response: Response, _next: NextFunction): void => {

    const errorType = error.constructor.name;
    const errorMessage: ErrorMessage | ConstraintViolationErrorMessage = errorType == InvalidRequestError.name
        ? { message: error.message, violations: (error as InvalidRequestError).constraintViolations }
        : { message: error.message };

    if ("violations" in errorMessage) {
        logger.error(`A constraint violation occurred while processing the request: ${JSON.stringify(errorMessage.violations)}`);
    } else {
        logger.error(`An error occurred while processing the request: ${error.message}`);
    }

    response
        .status(errorStatusMap.get(errorType) ?? HttpStatus.INTERNAL_SERVER_ERROR)
        .json(errorMessage);
};

/**
 * Creates a request tracking middleware for Express. Allows TSLog logging library to include a shared request ID
 * across the log messages created within a single web request.
 *
 * @param _request Express Request object
 * @param _response Express Response object
 * @param next Express next function
 */
export const requestTrackingMiddleware = async (_request: Request, _response: Response, next: NextFunction): Promise<void> => {

    const requestId = UUID();
    await LoggerFactory.asyncLocalStorage.run({ requestId }, async () => {
        return next();
    });
}
