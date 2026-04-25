import { OAuthProvider } from "@coordinator/core/config/oauth-providers-config-module";
import { OAuthDescriptor, ProviderSecret } from "@coordinator/core/domain/oauth";
import { MissingOAuthEntityError, OAuthRegistrationError } from "@coordinator/core/error/error-types";
import { OAuthProviderType, OAuthRegistrationAdapter, RegistrationResult } from "@coordinator/core/service/oauth";
import {
    OAuthApplicationModel,
    OAuthApplicationRegistrationRequest,
    OAuthApplicationRegistrationResponse,
    OAuthApplicationSummaryModel,
    RegistrationContext,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags/index";
import { lagsClient, LAGSClient } from "@coordinator/core/service/oauth/lags/lags-client";
import { lagsDataCollector, LAGSDataCollector } from "@coordinator/core/service/oauth/lags/lags-data-collector";
import {
    lagsRegistrationRequestFactory,
    LAGSRegistrationRequestFactory
} from "@coordinator/core/service/oauth/lags/lags-registration-request-factory";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * OAuthRegistrationAdapter implementation using LAGS as backing OAuth Authorization Server.
 * Supports dry-run by returning after verifying the descriptor and generating some of the secrets, but before
 * submitting the changes to LAGS (i.e. actually creating a new or editing an existing registration).
 */
export class LAGSOAuthRegistrationAdapter implements OAuthRegistrationAdapter {

    private readonly logger = LoggerFactory.getLogger(LAGSOAuthRegistrationAdapter);

    private readonly lagsClient: LAGSClient;
    private readonly lagsDataCollector: LAGSDataCollector;
    private readonly lagsRegistrationRequestFactory: LAGSRegistrationRequestFactory;

    constructor(lagsClient: LAGSClient, lagsDataCollector: LAGSDataCollector,
                lagsRegistrationRequestFactory: LAGSRegistrationRequestFactory) {
        this.lagsClient = lagsClient;
        this.lagsDataCollector = lagsDataCollector;
        this.lagsRegistrationRequestFactory = lagsRegistrationRequestFactory;
    }

    public async register(provider: OAuthProvider, name: string, descriptor: OAuthDescriptor, dryRun: boolean): Promise<RegistrationResult> {

        this.logger.info(`Application registration using LAGS provider has started...`);

        try {
            const context = await this.createContext(provider, name, descriptor);
            const registrationRequest = this.lagsRegistrationRequestFactory.createRequest(context);

            if (context.registeredApplication) {
                this.logger.warn(`Application '${name}' is already registered, import will overwrite existing configuration`);
            }

            const secrets = this.createSecrets(registrationRequest);
            if (dryRun) {
                this.logger.warn(`Dry-run has been requested, skipping making changes on the selected OAuth provider`);
                return { secrets };
            }

            const response = await (context.registeredApplication
                ? this.lagsClient.editApplication(provider, context.registeredApplication!.id, registrationRequest)
                : this.lagsClient.createApplication(provider, registrationRequest));

            const clientSecret = await this.rollClientSecretIfNeeded(provider, context, response);
            if (clientSecret) {
                secrets.set("client-secret", clientSecret);
            }

            this.logger.info(`Application '${name}' has been registered in OAuth provider '${provider.name}'`);

            return { secrets };

        } catch (error: any) {

            if (error instanceof MissingOAuthEntityError) {
                throw error;
            }

            this.logger.error("Application registration failed", error);
            throw new OAuthRegistrationError(`Application registration failed: ${error?.message}`);
        }
    }

    public forProviderType(): OAuthProviderType {
        return OAuthProviderType.LAGS;
    }

    private async createContext(provider: OAuthProvider, name: string, descriptor: OAuthDescriptor): Promise<RegistrationContext> {

        const registeredApplications = await this.lagsClient.getAllApplications(provider);
        const registeredPermissions = await this.lagsClient.getAllPermissions(provider);

        return new RegistrationContext({
            name, descriptor,
            applicationMap: this.lagsDataCollector.identifyClientApplications(registeredApplications, descriptor),
            permissionMap: this.lagsDataCollector.identifyPermissions(registeredPermissions, descriptor),
            registeredApplication: await this.findRegisteredApplication(provider, registeredApplications, name)
        });
    }

    private createSecrets(registrationRequest: OAuthApplicationRegistrationRequest): Map<ProviderSecret, string | undefined | null> {

        const secrets = new Map<ProviderSecret, string | undefined | null>([
            ["client-id", registrationRequest.clientID]
        ]);
        if (registrationRequest.resourceServer?.audience) {
            secrets.set("audience", registrationRequest.resourceServer.audience);
        }

        return secrets;
    }

    private async rollClientSecretIfNeeded(provider: OAuthProvider, context: RegistrationContext,
                                           response: OAuthApplicationRegistrationResponse): Promise<string | undefined> {

        let clientSecret = response.clientSecret;
        if (!clientSecret && context.descriptor.behavior.rollClientSecretOnDeploy) {
            this.logger.warn(`Rolling client secret for OAuth application '${context.registeredApplication?.name}'`);
            clientSecret = (await this.lagsClient.regenerateApplicationSecret(provider, response.id)).clientSecret;
        }

        return clientSecret;
    }

    private async findRegisteredApplication(provider: OAuthProvider, applications: SimplifiedPageModel<OAuthApplicationSummaryModel>,
                                            name: string): Promise<OAuthApplicationModel | undefined> {

        return applications.content
            ?.filter(application => application.name === name)
            .map(application => this.lagsClient.getApplicationByID(provider, application.id))
            .find(_ => true);
    }

}

export const lagsSOAuthRegistrationAdapter =
    new LAGSOAuthRegistrationAdapter(lagsClient, lagsDataCollector, lagsRegistrationRequestFactory);
