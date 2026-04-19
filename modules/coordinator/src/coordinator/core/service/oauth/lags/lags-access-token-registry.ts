import { OAuthProvider } from "@coordinator/core/config/oauth-providers-config-module";
import { SecretValueWrapper } from "@coordinator/core/domain";
import { ProviderSecret } from "@coordinator/core/domain/oauth";
import { MissingSecretError } from "@coordinator/core/error/error-types";
import { secretService, SecretService } from "@coordinator/core/service/secret-service";
import axios, { AxiosResponse } from "axios";

interface CachedToken {

    accessToken: string;
    expiresAt: number;
}

interface TokenResponse {

    access_token: string;
    expires_in: number;
    scope: string;
}

interface ProviderSecretGroup {
    clientID: string;
    clientSecret: string;
    audience: string;
}

/**
 * Registry implementation holding LAGS OAuth Client Credentials access tokens, handling automatic renewal as well.
 */
export class LAGSAccessTokenRegistry {

    private readonly expirationThresholdInMS = 300_000;
    private readonly scope = [
        "read:access:permissions",
        "read:access:applications",
        "write:access:applications"
    ].join(" ");

    private readonly secretService: SecretService;
    private readonly tokenCache: Map<string, CachedToken>;

    constructor(secretService: SecretService) {
        this.secretService = secretService;
        this.tokenCache = new Map<string, CachedToken>();
    }

    /**
     * Requests an active LAGS access token for the given LAGS instance. If there's no stored access token or the stored
     * access token is close to expiration (without 5 minutes), a new access token is requested beforehand.
     *
     * @param provider provider (LAGS instance) to request token for
     */
    public async getAccessToken(provider: OAuthProvider): Promise<string> {

        if (this.requiresRenewal(provider)) {
            const tokenResponse = (await this.requestToken(provider)).data;
            this.tokenCache.set(provider.name, {
                accessToken: tokenResponse.access_token,
                expiresAt: new Date().getTime() + (tokenResponse.expires_in * 1000),
            })
        }

        return this.tokenCache.get(provider.name)!.accessToken;
    }

    private requiresRenewal(provider: OAuthProvider): boolean {

        return !this.tokenCache.get(provider.name)
            || (this.tokenCache.get(provider.name)!.expiresAt - new Date().getTime()) < this.expirationThresholdInMS;
    }

    private async requestToken(provider: OAuthProvider): Promise<AxiosResponse<TokenResponse>> {

        const providerSecrets = await this.getProviderSecrets(provider);

        const tokenForm = new FormData();
        tokenForm.set("grant_type", "client_credentials");
        tokenForm.set("scope", this.scope);
        tokenForm.set("client_id", providerSecrets.clientID);

        const tokenRequestBasicCredentials = Buffer
            .from(`${providerSecrets.clientID}:${providerSecrets.clientSecret}`)
            .toString("base64");

        return axios.request({
            method: "POST",
            baseURL: provider.host,
            url: "/oauth/token",
            data: tokenForm,
            headers: {
                Authorization: `Basic ${tokenRequestBasicCredentials}`
            },
            params: {
                "audience": providerSecrets.audience
            }
        });
    };

    private async getProviderSecrets(provider: OAuthProvider): Promise<ProviderSecretGroup> {

        const context = `domino.oauth.provider.${provider.name}`;
        const providerSecrets = await this.secretService.retrieveSecretsByContext(context, "domino");

        return {
            clientID: this.getRequiredSecret(providerSecrets, context, "client-id"),
            clientSecret: this.getRequiredSecret(providerSecrets, context, "client-secret"),
            audience: this.getRequiredSecret(providerSecrets, context, "audience")
        }
    }

    private getRequiredSecret(providerSecrets: SecretValueWrapper, context: string, value: ProviderSecret): string {

        const secretKey = `${context}.${value}`;

        if (!(secretKey in providerSecrets)) {
            throw new MissingSecretError(secretKey);
        }

        return providerSecrets[secretKey];
    }
}

export const lagsAccessTokenRegistry = new LAGSAccessTokenRegistry(secretService);
