import {
    OAuthProvider,
    oAuthProvidersConfigModule,
    OAuthProvidersConfigModule
} from "@coordinator/core/config/oauth-providers-config-module";
import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import { MissingOAuthProviderError, MissingOAuthRegistrationAdapterError } from "@coordinator/core/error/error-types";
import { OAuthProviderType, OAuthRegistrationAdapter, RegistrationResult } from "@coordinator/core/service/oauth";
import { lagsSOAuthRegistrationAdapter } from "@coordinator/core/service/oauth/lags/lags-oauth-registration-adapter";
import { secretService, SecretService } from "@coordinator/core/service/secret-service";
import { Deployment } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Coordinator logic for OAuth application descriptor processing and registration via an external OAuth Authorization Server.
 */
export class OAuthRegistrationHandler {

    private readonly logger = LoggerFactory.getLogger(OAuthRegistrationHandler);

    private readonly oAuthProvidersConfigModule: OAuthProvidersConfigModule;
    private readonly secretService: SecretService;
    private readonly oAuthRegistrationAdapters: Map<OAuthProviderType, OAuthRegistrationAdapter>;

    constructor(oAuthProvidersConfigModule: OAuthProvidersConfigModule, secretService: SecretService,
                oAuthRegistrationAdapters: OAuthRegistrationAdapter[]) {

        this.oAuthProvidersConfigModule = oAuthProvidersConfigModule;
        this.secretService = secretService;
        this.oAuthRegistrationAdapters = new Map(oAuthRegistrationAdapters
            .map(adapter => [adapter.forProviderType(), adapter]));
    }

    /**
     * Imports the given OAuth application descriptor by selecting the referenced provider and its related adapter,
     * then executing the registration using the latter one. If secrets are requested by the descriptor, those will be
     * stored in the secret store.
     *
     * @param deployment deployment to "attach" this OAuth descriptor to
     * @param applicationName OAuth application name (will be used as a relation reference by other applications)
     * @param descriptor OAuth descriptor contents
     * @param dryRun flag to indicate not to store the changes caused by importing this descriptor
     * @throws MissingOAuthProviderError on missing references OAuth provider (target OAuth Authorization Server)
     * @throws MissingOAuthRegistrationAdapterError on selecting an unimplemented provider adapter
     */
    public async importOAuthDescriptor(deployment: Deployment, applicationName: string, descriptor: OAuthDescriptor, dryRun: boolean): Promise<void> {

        this.logger.info(`Importing OAuth descriptor '${applicationName}' for deployment '${deployment.id}' ${dryRun ? "in dry-run mode" : ""}`);

        const provider = this.getRequiredProvider(descriptor);
        const adapter = this.getRequiredAdapter(provider);
        const result = await adapter.register(provider, applicationName, descriptor, dryRun);

        if (!dryRun) {
            await this.storeSecrets(descriptor, result, deployment);
            this.logger.info(`OAuth application '${applicationName}' for deployment '${deployment.id}' has been successfully imported.`);
        }
    }

    private getRequiredProvider(oAuthDescriptor: OAuthDescriptor): OAuthProvider {

        const targetProvider = oAuthDescriptor.behavior.targetProvider;
        const provider = this.oAuthProvidersConfigModule.getConfiguration()
            .providers
            .find(provider => provider.name === targetProvider);

        if (!provider) {
            this.logger.error(`OAuth provider '${targetProvider}' not found.`);
            throw new MissingOAuthProviderError(targetProvider);
        }

        this.logger.info(`Application will be registered in OAuth provider '${targetProvider}'`);

        return provider;
    }

    private getRequiredAdapter(provider: OAuthProvider): OAuthRegistrationAdapter {

        const adapter = this.oAuthRegistrationAdapters.get(provider.providerType);

        if (!adapter) {
            this.logger.error(`OAuth registration adapter '${provider.providerType}' not found.`);
            throw new MissingOAuthRegistrationAdapterError(provider.providerType);
        }

        this.logger.info(`Application will be registered using the adapter '${provider.providerType}'`);

        return adapter;
    }

    private async storeSecrets(descriptor: OAuthDescriptor, result: RegistrationResult, deployment: Deployment): Promise<void> {

        for (const secret of descriptor.behavior.useSecretManagerFor) {

            if (!result.secrets.has(secret)) {
                continue;
            }

            const context = `domino.oauth.${descriptor.tenant.name}.${descriptor.tenant.environment}.${deployment.id}`;
            const key = `${context}.${secret}`;

            if (await this.secretService.secretExists(key)) {
                await this.secretService.deleteSecret(key);
            }
            await this.secretService.createSecret({ context, key, value: result.secrets.get(secret)! });
        }
    }
}

export const oAuthRegistrationHandler = new OAuthRegistrationHandler(oAuthProvidersConfigModule, secretService, [lagsSOAuthRegistrationAdapter]);
