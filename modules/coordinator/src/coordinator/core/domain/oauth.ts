import { IsIn, IsNotEmpty, ValidateNested } from "class-validator";

export type ProviderSecret = "client-id" | "client-secret" | "audience";

/**
 * Submodel defining a client application.
 */
export class OAuthAllowedClientParameters {

    @IsNotEmpty()
    readonly name: string;

    @IsNotEmpty()
    readonly allowedPermissions: string[];

    constructor(allowedClient: any) {
        this.name = allowedClient.name;
        this.allowedPermissions = allowedClient["allowed-permissions"] ?? [];
    }
}

/**
 * Submodel defining a resource server application.
 */
export class OAuthResourceServerParameters {

    readonly useAudience: boolean;
    readonly registeredPermissions: string[];

    @IsNotEmpty()
    @ValidateNested({ each: true })
    readonly allowedClients: OAuthAllowedClientParameters[];

    constructor(resourceServer: any) {
        this.useAudience = resourceServer["use-audience"] ?? false;
        this.registeredPermissions = resourceServer["registered-permissions"] ?? [];
        this.allowedClients = ((resourceServer["allowed-clients"] ?? []) as any[])
            .map(client => new OAuthAllowedClientParameters(client));
    }
}

/**
 * Submodel defining the allowed clients of a resource server.
 */
export class OAuthClientParameters {

    readonly allowedCallbacks: string[];
    readonly requiredPermissions: string[];

    constructor(client: any) {
        this.allowedCallbacks = client["allowed-callbacks"] ?? [];
        this.requiredPermissions = client["required-permissions"] ?? [];
    }
}

/**
 * Submodel defining some parameters defining how the client IDs and audience values will be generated.
 */
export class OAuthTenantParameters {

    @IsNotEmpty()
    readonly environment: string;

    @IsNotEmpty()
    readonly name: string;

    constructor(common: any) {
        this.environment = common.environment;
        this.name = common.name;
    }
}

/**
 * Submodel defining the behavioral directives of an OAuth application registration.
 */
export class OAuthBehavior {

    @IsNotEmpty()
    readonly targetProvider: string;

    readonly rollClientSecretOnDeploy: boolean;

    @IsNotEmpty()
    @IsIn(["client-id", "client-secret", "audience"], { each: true })
    readonly useSecretManagerFor: ProviderSecret[];

    constructor(behavior: any) {
        this.targetProvider = behavior["target-provider"];
        this.rollClientSecretOnDeploy = behavior["roll-client-secret-on-deploy"];
        this.useSecretManagerFor = behavior["use-secret-manager-for"];
    }
}

/**
 * Request model defining an OAuth application registration.
 */
export class OAuthDescriptor {

    @IsNotEmpty()
    @ValidateNested()
    readonly behavior: OAuthBehavior;

    @IsNotEmpty()
    @ValidateNested()
    readonly tenant: OAuthTenantParameters;

    @ValidateNested()
    readonly client?: OAuthClientParameters;

    @ValidateNested()
    readonly resourceServer?: OAuthResourceServerParameters;

    constructor(yamlContent: any) {
        this.behavior = new OAuthBehavior(yamlContent.behavior);
        this.tenant = new OAuthTenantParameters(yamlContent.tenant);
        this.client = yamlContent.client
            ? new OAuthClientParameters(yamlContent.client)
            : undefined;
        this.resourceServer = yamlContent["resource-server"]
            ? new OAuthResourceServerParameters(yamlContent["resource-server"])
            : undefined;
    }
}
