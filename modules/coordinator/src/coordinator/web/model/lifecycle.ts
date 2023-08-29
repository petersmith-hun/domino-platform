import { validIDMatcher, validVersionMatcher } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { IsOptional, Matches } from "class-validator";
import { Request } from "express";
import { hrtime } from "node:process";

/**
 * Lifecycle request model.
 */
export class LifecycleRequest {

    @Matches(validIDMatcher)
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

    @IsOptional()
    @Matches(validVersionMatcher)
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
    version?: string;
}
