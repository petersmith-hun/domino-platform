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
    locked: boolean;
}

/**
 * Internal domain class to hold one or more decrypted secrets.
 */
export interface SecretValueWrapper {
    [key: string]: string;
}
