import { ExecutionType, SourceType } from "@core-lib/platform/api/deployment";

/**
 * Internal domain class representing a deployment request.
 */
export interface DeploymentAttributes {
    deployment: string;
    version?: string;
}

/**
 * Internal domain class representing a set of page attributes.
 */
export interface PageAttributes {
    page: number;
    limit: number;
}

/**
 * Internal domain class wrapping a page of items.
 */
export interface Page<T> {
    pageNumber: number;
    pageSize: number;
    itemCountOnPage: number;
    totalPages: number;
    totalItemCount: number;
    items: T[];
}

/**
 * Internal domain class representing some base information of a deployment.
 */
export interface DeploymentSummary {

    id: string;
    sourceType: SourceType;
    executionType: ExecutionType;
    home: string;
    resource: string;
}

/**
 * Possible result statuses of saving a deployment definition.
 */
export enum DefinitionSaveResult {

    /**
     * Definition already exists and hasn't changed, ignoring request (still considered to be successful).
     */
    IGNORED = "IGNORED",

    /**
     * Definition already exists, and it is locked (due to having been imported via API).
     */
    LOCKED = "LOCKED",

    /**
     * Definition has been saved (or overwritten if already existed and changed).
     */
    SAVED = "SAVED"
}
