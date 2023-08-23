import { DeploymentStatus } from "@coordinator/core/domain";
import { Request } from "express";
import { hrtime } from "node:process";

/**
 * Lifecycle request model.
 */
export class LifecycleRequest {

    readonly deployment: string;
    readonly callStartTime: bigint;

    constructor(request: Request) {
        this.deployment = request.params.deployment;
        this.callStartTime = hrtime.bigint();
    }
}

/**
 * Lifecycle request model with optional version field (for deployment requests).
 */
export class VersionedLifecycleRequest extends LifecycleRequest {

    readonly version?: string;

    constructor(request: Request) {
        super(request);
        this.version = request.params.version;
    }
}

/**
 * Response model for lifecycle requests.
 */
export interface LifecycleResponse {
    message: string;
    status: DeploymentStatus;
}

/**
 * Response model for deployment requests.
 */
export interface DeploymentResponse extends LifecycleResponse {
    version: string;
}
