import { Deployment, validIDMatcher } from "@core-lib/platform/api/deployment";
import { Contains, IsNotEmpty, Matches } from "class-validator";
import { Request } from "express";

/**
 * Deployment definition data with its metadata.
 */
export interface ExtendedDeployment extends Deployment {

    metadata: {
        locked: boolean;
        createdAt: Date;
        updatedAt: Date;
    }
}

/**
 * Response model for YAML-formatted deployment definition exports. Response is still formatted as JSON, the definition
 * itself is returned in the "definition" field as YAML-formatted string.
 */
export interface DeploymentExport {
    definition: string;
}

/**
 * Request model for retrieving a deployment definition. To export a deployment as YAML, "yaml" query parameter should
 * be set to true.
 */
export class GetDeploymentRequest {

    @IsNotEmpty()
    @Matches(validIDMatcher)
    readonly id: string;

    readonly yaml: boolean;

    constructor(request: Request) {
        this.id = request.params.id;
        this.yaml = request.query?.yaml === "true";
    }
}

/**
 * Request model for creating a new deployment definition. ID is read from the request body.
 */
export class DeploymentCreationRequest {

    @IsNotEmpty()
    @Matches(validIDMatcher)
    readonly id: string;

    @IsNotEmpty()
    readonly definition: Deployment;

    constructor(request: Request) {
        this.id = request.body.id;
        this.definition = request.body;
    }
}

/**
 * Request model for updating an existing deployment definition. ID is read from the "id" path variable, can be omitted
 * from the request body.
 */
export class DeploymentUpdateRequest {

    @IsNotEmpty()
    @Matches(validIDMatcher)
    readonly id: string;

    @IsNotEmpty()
    readonly definition: Omit<Deployment, "id">;

    constructor(request: Request) {
        this.id = request.params.id;
        this.definition = request.body;
    }
}

/**
 * Request model for importing a deployment definition. Definition must be provided as string, looking like this:
 * domino:
 *   deployments:
 *     {id}:
 *       source: ...
 *       ...
 *       # all the other parameters
 */
export class DeploymentImportRequest {

    @IsNotEmpty()
    @Contains("deployments")
    readonly definition: string;

    constructor(request: Request) {
        this.definition = request.body;
    }
}
