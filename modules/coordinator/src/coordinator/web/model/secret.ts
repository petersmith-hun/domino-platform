import { SecretAttributes, SecretCreationAttributes } from "@coordinator/core/domain/storage";
import { IsNotEmpty, Matches } from "class-validator";
import { Request } from "express";

const secretKeyPattern = /^[a-zA-Z][a-zA-Z0-9_.:\-]*$/;
const contextPattern = /^[a-zA-Z0-9]+$/;

const extractAccessedBy = (request: Request): string => {
    return request.auth?.payload?.sub ?? "direct-auth-admin";
}

/**
 * Request model for identifying a secret. Also stores the name of the user trying to access the secret.
 */
export class SecretAccessRequest {

    @IsNotEmpty()
    @Matches(secretKeyPattern)
    public readonly key: string;

    @IsNotEmpty()
    public readonly accessedBy: string;

    constructor(request: Request) {
        this.key = request.params.key;
        this.accessedBy = extractAccessedBy(request);
    }
}

/**
 * Request model for identifying a context of secrets. Also stores the name of the user trying to access the secret.
 */
export class ContextAccessRequest {

    @IsNotEmpty()
    @Matches(contextPattern)
    public readonly context: string;

    @IsNotEmpty()
    public readonly accessedBy: string;

    constructor(request: Request) {
        this.context = request.params.context;
        this.accessedBy = extractAccessedBy(request);
    }
}

/**
 * Request model for creating a secret.
 */
export class SecretCreationRequest implements SecretCreationAttributes {

    @IsNotEmpty()
    @Matches(secretKeyPattern)
    public readonly key: string;

    @IsNotEmpty()
    public readonly value: string;

    @IsNotEmpty()
    @Matches(contextPattern)
    public readonly context: string;

    constructor(request: Request) {
        this.key = request.body.key;
        this.value = request.body.value;
        this.context = request.body.context;
    }
}

/**
 * Response model for returning the metadata of a secret.
 */
export type SecretMetadataResponse = Omit<SecretAttributes, "value">;

/**
 * Response model for returning a group of secrets by context.
 */
export interface GroupedSecretMetadataResponse {
    context: string;
    secrets: SecretMetadataResponse[];
}
