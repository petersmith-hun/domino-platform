import { HttpStatus } from "@core-lib/platform/api/common";
import { Min } from "class-validator";
import { Request } from "express";

/**
 * Supported OAuth scopes.
 */
export enum Scope {
    READ_DEPLOYMENTS = "read:deployments",
    READ_INFO = "read:info",
    WRITE_DEPLOY = "write:deploy",
    WRITE_START = "write:start",
    WRITE_RESTART = "write:delete write:start",
    WRITE_DELETE = "write:delete"
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

/**
 * Model wrapping the page parameters for paginated endpoints.
 */
export class PageRequest {

    @Min(5)
    readonly size: number;

    @Min(1)
    readonly page: number;

    constructor(request: Request) {
        this.size = this.parseQueryParameter(request, "pageSize", 10);
        this.page = this.parseQueryParameter(request, "pageNumber", 1);
    }

    private parseQueryParameter(request: Request, key: string, defaultValue: number): number {

        const value = request?.query?.[key] as string;

        return value
            ? parseInt(value)
            : defaultValue;
    }
}

/**
 * Model representing the page attributes of a paginated response.
 */
export interface Pagination {

    entityCount: number;
    pageCount: number;
    pageNumber: number;
    entityCountOnPage: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Model wrapping the page attributes and the items on a page for paginated responses.
 */
export interface PageResponse<T> {

    pagination: Pagination;
    body: T[];
}
