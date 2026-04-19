import { OAuthProvider } from "@coordinator/core/config/oauth-providers-config-module";
import { OAuthDescriptor, ProviderSecret } from "@coordinator/core/domain/oauth";

/**
 * Supported OAuth provider types.
 */
export enum OAuthProviderType {
    LAGS = "lags"
}

/**
 * Details of a successful OAuth application registration.
 */
export interface RegistrationResult {

    /**
     * Contains the secret values created by the registration process.
     */
    secrets: Map<ProviderSecret, string | undefined | null>;
}

/**
 * Implementations of this interface should support the dynamic application registration API of certain kind of OAuth
 * Authorization Servers. Each implementation must be able to translate the common (Domino-bound) OAuth application
 * descriptor and submit the necessary the requests to the given OAuth Authorization Server in order to register the
 * application. If the process creates secrets, those must be communicated back in order for Domino to be able to store
 * them in the secret store.
 */
export interface OAuthRegistrationAdapter {

    /**
     * Executes OAuth application registration using the selected provider.
     *
     * @param provider additional data (e.g. host address) of the related provider
     * @param name OAuth application name (will be used as a relation reference by other applications)
     * @param descriptor OAuth descriptor contents
     * @param dryRun flag to indicate not to store the changes caused by importing this descriptor (if supported by target authorization server)
     */
    register(provider: OAuthProvider, name: string, descriptor: OAuthDescriptor, dryRun: boolean): Promise<RegistrationResult>;

    /**
     * Returns the type of provider this adapter supports.
     */
    forProviderType(): OAuthProviderType;
}
