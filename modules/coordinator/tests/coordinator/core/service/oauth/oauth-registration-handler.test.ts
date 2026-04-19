import {
    OAuthProvidersConfigModule,
    OAuthRegistrationConfig
} from "@coordinator/core/config/oauth-providers-config-module";
import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import { MissingOAuthProviderError, MissingOAuthRegistrationAdapterError } from "@coordinator/core/error/error-types";
import { OAuthProviderType, OAuthRegistrationAdapter, RegistrationResult } from "@coordinator/core/service/oauth";
import { LAGSOAuthRegistrationAdapter } from "@coordinator/core/service/oauth/lags/lags-oauth-registration-adapter";
import { OAuthRegistrationHandler } from "@coordinator/core/service/oauth/oauth-registration-handler";
import { SecretService } from "@coordinator/core/service/secret-service";
import { Deployment } from "@core-lib/platform/api/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for OAuthRegistrationHandler", () => {

    let oAuthProvidersConfigModuleMock: SinonStubbedInstance<OAuthProvidersConfigModule>;
    let secretServiceMock: SinonStubbedInstance<SecretService>;
    let oAuthRegistrationAdapterMock: SinonStubbedInstance<OAuthRegistrationAdapter>;
    let oAuthRegistrationHandler: OAuthRegistrationHandler;

    beforeEach(() => {
        oAuthProvidersConfigModuleMock = sinon.createStubInstance(OAuthProvidersConfigModule);
        secretServiceMock = sinon.createStubInstance(SecretService);
        oAuthRegistrationAdapterMock = sinon.createStubInstance(LAGSOAuthRegistrationAdapter);

        oAuthRegistrationAdapterMock.forProviderType.returns(OAuthProviderType.LAGS);

        oAuthRegistrationHandler = new OAuthRegistrationHandler(oAuthProvidersConfigModuleMock, secretServiceMock, [
            oAuthRegistrationAdapterMock
        ])
    });

    describe("Test scenarios for #importOAuthDescriptor", () => {

        it("should import descriptor", async () => {

            // given
            const deployment = {
                id: "app"
            } as Deployment;
            const descriptor = {
                behavior: {
                    targetProvider: "provider1",
                    useSecretManagerFor: ["client-secret", "client-id", "audience"]
                },
                tenant: {
                    name: "localhost",
                    environment: "test",
                },
            } as OAuthDescriptor;
            const configuration = {
                providers: [
                    { name: "provider1", providerType: OAuthProviderType.LAGS },
                    { name: "provider2", providerType: OAuthProviderType.LAGS }
                ]
            } as OAuthRegistrationConfig;
            const registrationResult = {
                secrets: new Map([
                    ["client-secret", "secret-1"],
                    ["client-id", "id-1"],
                    ["audience", "aud"]
                ])
            } as RegistrationResult;

            const secretContext = "domino.oauth.localhost.test.app";
            const secretKeyClientID = "domino.oauth.localhost.test.app.client-id";
            const secretKeyClientSecret = "domino.oauth.localhost.test.app.client-secret";
            const secretKeyAudience = "domino.oauth.localhost.test.app.audience";

            oAuthProvidersConfigModuleMock.getConfiguration.returns(configuration);
            oAuthRegistrationAdapterMock.register.withArgs(configuration.providers[0], "new-app", descriptor, false).resolves(registrationResult);

            secretServiceMock.secretExists.withArgs(secretKeyClientID).resolves(true);
            secretServiceMock.secretExists.withArgs(secretKeyClientSecret).resolves(false);
            secretServiceMock.secretExists.withArgs(secretKeyAudience).resolves(false);

            // when
            await oAuthRegistrationHandler.importOAuthDescriptor(deployment, "new-app", descriptor, false);

            // then
            sinon.assert.calledWith(secretServiceMock.deleteSecret, secretKeyClientID);
            sinon.assert.calledWith(secretServiceMock.createSecret, {
                context: secretContext,
                key: secretKeyClientID,
                value: "id-1"
            });
            sinon.assert.calledWith(secretServiceMock.createSecret, {
                context: secretContext,
                key: secretKeyClientSecret,
                value: "secret-1"
            });
            sinon.assert.calledWith(secretServiceMock.createSecret, {
                context: secretContext,
                key: secretKeyAudience,
                value: "aud"
            });
            sinon.assert.callCount(secretServiceMock.deleteSecret, 1);
        });

        it("should skip storing secrets in dry-run mode", async () => {

            // given
            const deployment = {
                id: "app"
            } as Deployment;
            const descriptor = {
                behavior: {
                    targetProvider: "provider1",
                    useSecretManagerFor: ["client-secret", "client-id", "audience"]
                },
                tenant: {
                    name: "localhost",
                    environment: "test",
                },
            } as OAuthDescriptor;
            const configuration = {
                providers: [
                    { name: "provider1", providerType: OAuthProviderType.LAGS },
                    { name: "provider2", providerType: OAuthProviderType.LAGS }
                ]
            } as OAuthRegistrationConfig;
            const registrationResult = {
                secrets: new Map([
                    ["client-id", "id-1"],
                    ["audience", "aud"]
                ])
            } as RegistrationResult;

            oAuthProvidersConfigModuleMock.getConfiguration.returns(configuration);
            oAuthRegistrationAdapterMock.register.withArgs(configuration.providers[0], "new-app", descriptor, true).resolves(registrationResult);

            // when
            await oAuthRegistrationHandler.importOAuthDescriptor(deployment, "new-app", descriptor, true);

            // then
            sinon.assert.notCalled(secretServiceMock.createSecret);
            sinon.assert.notCalled(secretServiceMock.deleteSecret);
            sinon.assert.notCalled(secretServiceMock.secretExists);
        });

        it("should throw error on missing provider", async () => {

            // given
            const deployment = {
                id: "app"
            } as Deployment;
            const descriptor = {
                behavior: {
                    targetProvider: "provider-non-existent",
                    useSecretManagerFor: ["client-secret", "client-id", "audience"]
                },
                tenant: {
                    name: "localhost",
                    environment: "test",
                },
            } as OAuthDescriptor;
            const configuration = {
                providers: [
                    { name: "provider1", providerType: OAuthProviderType.LAGS },
                    { name: "provider2", providerType: OAuthProviderType.LAGS }
                ]
            } as OAuthRegistrationConfig;

            oAuthProvidersConfigModuleMock.getConfiguration.returns(configuration);

            // when
            const failingCall = () => oAuthRegistrationHandler.importOAuthDescriptor(deployment, "new-app", descriptor, true);

            // then
            // exception expected
            await expect(failingCall).rejects.toThrow(MissingOAuthProviderError);
        });

        it("should throw error on missing adapter", async () => {

            // given
            const deployment = {
                id: "app"
            } as Deployment;
            const descriptor = {
                behavior: {
                    targetProvider: "provider1",
                    useSecretManagerFor: ["client-secret", "client-id", "audience"]
                },
                tenant: {
                    name: "localhost",
                    environment: "test",
                },
            } as OAuthDescriptor;
            const configuration = {
                providers: [
                    { name: "provider1", providerType: OAuthProviderType.LAGS },
                    { name: "provider2", providerType: OAuthProviderType.LAGS }
                ]
            } as OAuthRegistrationConfig;

            oAuthProvidersConfigModuleMock.getConfiguration.returns(configuration);

            oAuthRegistrationHandler = new OAuthRegistrationHandler(oAuthProvidersConfigModuleMock, secretServiceMock, [])

            // when
            const failingCall = () => oAuthRegistrationHandler.importOAuthDescriptor(deployment, "new-app", descriptor, true);

            // then
            // exception expected
            await expect(failingCall).rejects.toThrow(MissingOAuthRegistrationAdapterError);
        });
    });
});
