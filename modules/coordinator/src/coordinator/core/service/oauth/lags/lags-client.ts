import { OAuthProvider } from "@coordinator/core/config/oauth-providers-config-module";
import { BaseRestClient } from "@coordinator/core/service/oauth/lags/base-rest-client";
import {
    OAuthApplicationModel,
    OAuthApplicationRegistrationRequest,
    OAuthApplicationRegistrationResponse,
    OAuthApplicationSummaryModel,
    PermissionModel,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags";
import {
    lagsAccessTokenRegistry,
    LAGSAccessTokenRegistry
} from "@coordinator/core/service/oauth/lags/lags-access-token-registry";
import { RequestMethod, RESTRequest } from "@coordinator/core/service/oauth/lags/requests";

enum LAGSPaths {
    PERMISSIONS = "/access-management/permissions",
    APPLICATIONS = "/access-management/oauth-applications",
    APPLICATIONS_BY_ID = "/access-management/oauth-applications/{id}",
    APPLICATIONS_BY_ID_SECRET = "/access-management/oauth-applications/{id}/secret"
}

/**
 * Client implementation for LAGS API communication, handling OAuth application registrations.
 */
export class LAGSClient extends BaseRestClient {

    private readonly lagsAccessTokenRegistry: LAGSAccessTokenRegistry;

    constructor(lagsAccessTokenRegistry: LAGSAccessTokenRegistry) {
        super();
        this.lagsAccessTokenRegistry = lagsAccessTokenRegistry;
    }

    /**
     * Retrieves the given page of permissions.
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     */
    public async getAllPermissions(provider: OAuthProvider): Promise<SimplifiedPageModel<PermissionModel>> {

        const request = new RESTRequest({
            method: RequestMethod.GET,
            path: LAGSPaths.PERMISSIONS,
            queryParameters: { page: 0 },
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    /**
     * Retrieves the given page of OAuth application registrations for listing (summary only).
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     */
    public async getAllApplications(provider: OAuthProvider): Promise<SimplifiedPageModel<OAuthApplicationSummaryModel>> {

        const request = new RESTRequest({
            method: RequestMethod.GET,
            path: LAGSPaths.APPLICATIONS,
            queryParameters: { page: 0 },
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    /**
     * Retrieves the details of the given OAuth application registration.
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     * @param id application ID
     */
    public async getApplicationByID(provider: OAuthProvider, id: string): Promise<OAuthApplicationModel> {

        const request = new RESTRequest({
            method: RequestMethod.GET,
            path: LAGSPaths.APPLICATIONS_BY_ID,
            pathParameters: { id },
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    /**
     * Creates a new OAuth application registration.
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     * @param application OAuth application data
     */
    public async createApplication(provider: OAuthProvider, application: OAuthApplicationRegistrationRequest): Promise<OAuthApplicationRegistrationResponse> {

        const request = new RESTRequest({
            method: RequestMethod.POST,
            path: LAGSPaths.APPLICATIONS,
            requestBody: application,
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    /**
     * Edits an existing OAuth application registration.
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     * @param id ID of the OAuth application to update
     * @param application OAuth application data
     */
    public async editApplication(provider: OAuthProvider, id: string, application: OAuthApplicationRegistrationRequest): Promise<OAuthApplicationRegistrationResponse> {

        const request = new RESTRequest({
            method: RequestMethod.PUT,
            path: LAGSPaths.APPLICATIONS_BY_ID,
            pathParameters: { id },
            requestBody: application,
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    /**
     * Regenerates the OAuth client secret of the given application.
     *
     * @param provider OAuth provider definition to select LAGS instance to communicate with
     * @param id ID of the OAuth application to regenerate secret of
     */
    public async regenerateApplicationSecret(provider: OAuthProvider, id: string): Promise<OAuthApplicationRegistrationResponse> {

        const request = new RESTRequest({
            method: RequestMethod.PUT,
            path: LAGSPaths.APPLICATIONS_BY_ID_SECRET,
            pathParameters: { id },
            authorization: await this.getAuthorization(provider)
        });

        return this.doCall(provider, request);
    }

    private async getAuthorization(provider: OAuthProvider): Promise<Record<"Authorization", string>> {

        return {
            Authorization: `Bearer ${await this.lagsAccessTokenRegistry.getAccessToken(provider)}`
        }
    }

    private async doCall<T>(provider: OAuthProvider, request: RESTRequest): Promise<T> {

        return this.call(provider.host, request)
            .then(response => response.data)
            .then(data => data as Promise<T>);
    }
}

export const lagsClient = new LAGSClient(lagsAccessTokenRegistry);
