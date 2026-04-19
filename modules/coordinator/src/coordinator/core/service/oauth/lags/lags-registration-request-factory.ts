import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import {
    ClientApplicationRequest,
    OAuthApplicationRegistrationRequest,
    RegistrationContext,
    RegistrationType,
    ResourceServerApplicationRequest
} from "@coordinator/core/service/oauth/lags/index";
import { v4 as UUID } from "uuid";

/**
 * Factory implementation to create an OAuth application registration request for LAGS.
 */
export class LAGSRegistrationRequestFactory {

    /**
     * Creates an application registration request based on the given registration context.
     *
     * @param context RegistrationContext object containing all resolved and verified information based on the descriptor
     */
    public createRequest(context: RegistrationContext): OAuthApplicationRegistrationRequest {

        return {
            name: context.name,
            registrationType: this.getRegistrationType(context.descriptor),
            clientID: context.registeredApplication?.clientID ?? this.createClientID(context),
            resourceServer: this.createResourceServer(context),
            client: this.createClient(context),
        }
    }

    private getRegistrationType(descriptor: OAuthDescriptor): RegistrationType {

        if (descriptor.client && descriptor.resourceServer) {
            return RegistrationType.MIDDLE_RESOURCE_SERVER;
        }

        return descriptor.client
            ? RegistrationType.CLIENT
            : RegistrationType.RESOURCE_SERVER;
    }

    private createClientID(context: RegistrationContext): string {

        const tenantName = context.descriptor.tenant.name;
        const applicationType = context.descriptor.resourceServer ? "service" : "client";
        const randomSuffix = UUID().substring(0, 4);

        return `${tenantName}-${applicationType}-${context.name}-${randomSuffix}`;
    }

    private createResourceServer(context: RegistrationContext): ResourceServerApplicationRequest | undefined {

        const resourceServer = context.descriptor.resourceServer;

        if (!resourceServer) {
            return undefined;
        }

        return {
            audience: context.registeredApplication?.resourceServer?.audience ?? this.createAudience(context),
            allowedClients: resourceServer.allowedClients.map(client => ({
                applicationID: context.applicationMap.get(client.name)!,
                allowedPermissions: client.allowedPermissions
                    .map(permissionName => context.permissionMap.get(permissionName)!)
            })),
            registeredPermissions: resourceServer.registeredPermissions
                .map(permissionName => context.permissionMap.get(permissionName)!)
        }
    }

    private createAudience(context: RegistrationContext): string {

        const tenantName = context.descriptor.tenant.name;
        const tenantEnvironment = context.descriptor.tenant.environment;

        return `${tenantName}:svc:${context.name}:${tenantEnvironment}`
    }

    private createClient(context: RegistrationContext): ClientApplicationRequest | undefined {

        const client = context.descriptor.client;

        if (!client) {
            return undefined;
        }

        return {
            allowedCallbacks: client.allowedCallbacks.map(url => ({
                url: url,
                id: context.registeredApplication?.client?.allowedCallbacks
                    ?.find(callback => callback.url === url)?.id
            })),
            requiredPermissions: client.requiredPermissions
                .map(permissionName => context.permissionMap.get(permissionName)!)
        }
    }
}

export const lagsRegistrationRequestFactory = new LAGSRegistrationRequestFactory();
