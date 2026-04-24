import { OAuthProviderType } from "@coordinator/core/service/oauth";
import { ConfigurationModule, MapNode } from "@core-lib/platform/config";

type OAuthRegistrationConfigKey = "name" | "provider-type" | "host" | "providers";

/**
 * OAuth provider parameters.
 */
export interface OAuthProvider {

    name: string;
    providerType: OAuthProviderType;
    host: string;
}

/**
 * OAuth registration parameters.
 */
export interface OAuthRegistrationConfig {

    providers: OAuthProvider[];
}

/**
 * ConfigurationModule implementation for initializing the OAuth registration parameters.
 */
export class OAuthProvidersConfigModule extends ConfigurationModule<OAuthRegistrationConfig, OAuthRegistrationConfigKey> {

    constructor() {
        super("oauth-registration", mapNode => ({
            providers: this.mapProviders(mapNode)
        }));
        super.init();
    }

    private mapProviders(registration: MapNode): OAuthProvider[] {

        const providers = super.getNode(registration, "providers");

        return (providers as unknown as Array<any>)
            .map(provider => ({
                name: super.getValueFromObject(provider, "name"),
                providerType: super.getValueFromObject(provider, "provider-type"),
                host: super.getValueFromObject(provider, "host")
            }));
    }
}

export const oAuthProvidersConfigModule: OAuthProvidersConfigModule = new OAuthProvidersConfigModule();
