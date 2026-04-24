import { ImportedDeploymentConfigModule } from "@coordinator/core/config/deployment/imported-deployment-config-module";
import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import { Deployment, validIDMatcher } from "@core-lib/platform/api/deployment";
import {
    IsNotEmpty,
    Matches, Validate,
    ValidateNested,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from "class-validator";
import { Request } from "express";
import * as yaml from "js-yaml";

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
        this.definition = ImportedDeploymentConfigModule.fromJSON(request.body);
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
        this.definition = ImportedDeploymentConfigModule.fromJSON({ id: this.id, ...request.body });
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
    readonly definition: Deployment;

    constructor(request: Request) {
        this.definition = ImportedDeploymentConfigModule.fromYAML(request.body);
    }
}

/**
 * Custom constraint validator implementation to check if the given OAuth descriptor contains at least a client or a
 * resource server configuration.
 */
@ValidatorConstraint({ name: 'ValidRegistration', async: false })
class ValidRegistrationConstraint implements ValidatorConstraintInterface {

    validate(value: OAuthDescriptor): boolean {
        return value.client !== undefined || value.resourceServer !== undefined;
    }

    defaultMessage?(): string {
        return "Descriptor must contain a client or a resource server definition (or both).";
    }
}

type OAuthDescriptorRoot = { domino: { oauth: { [id: string]: any } } };

/**
 * Request model for importing an OAuth application descriptor.
 */
export class OAuthDescriptorImportRequest {

    @IsNotEmpty()
    @Matches(validIDMatcher)
    readonly deploymentID: string;

    @IsNotEmpty()
    readonly name: string;

    @IsNotEmpty()
    @ValidateNested()
    @Validate(ValidRegistrationConstraint)
    readonly descriptor: OAuthDescriptor;

    readonly dryRun: boolean;

    constructor(request: Request) {
        this.deploymentID = request.params.id;
        const descriptorRoot = yaml.load(request.body) as OAuthDescriptorRoot;
        this.name = Object.keys(descriptorRoot.domino.oauth).pop()!;
        this.descriptor = new OAuthDescriptor(descriptorRoot.domino.oauth[this.name]);
        this.dryRun = request.query?.["dry-run"] === "true";
    }
}
