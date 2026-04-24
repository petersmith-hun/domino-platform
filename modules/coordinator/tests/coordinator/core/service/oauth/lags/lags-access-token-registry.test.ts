import { MissingSecretError } from "@coordinator/core/error/error-types";
import { LAGSAccessTokenRegistry } from "@coordinator/core/service/oauth/lags/lags-access-token-registry";
import { SecretService } from "@coordinator/core/service/secret-service";
import { oauthProvider, wait } from "@testdata/core";
import axios from "axios";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for LAGSAccessTokenRegistry", () => {

    let axiosRequestStub: sinon.SinonStub;
    let secretService: SinonStubbedInstance<SecretService>;
    let lagsAccessTokenRegistry: LAGSAccessTokenRegistry;

    beforeAll(() => {
        axiosRequestStub = sinon.stub(axios, "request");
    });

    beforeEach(() => {
        secretService = sinon.createStubInstance(SecretService);
        lagsAccessTokenRegistry = new LAGSAccessTokenRegistry(secretService);
    });

    afterEach(() => {
        axiosRequestStub.reset();
    });

    describe("Test scenarios #getAccessToken", () => {

        it("should request new token", async () => {

            // given
            const response = {
                data: {
                    access_token: "access_token-1234",
                    expires_in: 3600
                }
            };

            secretService.retrieveSecretsByContext.withArgs("domino.oauth.provider.test", "domino")
                .resolves(providerSecrets);
            axiosRequestStub.resolves(response);

            // when
            const result = await lagsAccessTokenRegistry.getAccessToken(oauthProvider);

            // then
            expect(result).toEqual(response.data.access_token);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });

        it("should reuse existing token", async () => {

            // given
            const response = {
                data: {
                    access_token: "access_token-1234",
                    expires_in: 3600
                }
            };

            secretService.retrieveSecretsByContext.withArgs("domino.oauth.provider.test", "domino")
                .resolves(providerSecrets);
            axiosRequestStub.resolves(response);

            // when
            await lagsAccessTokenRegistry.getAccessToken(oauthProvider);
            await wait(1000);
            const result = await lagsAccessTokenRegistry.getAccessToken(oauthProvider);

            // then
            expect(result).toEqual(response.data.access_token);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
            sinon.assert.callCount(axiosRequestStub, 1);
        });

        it("should renew expired", async () => {

            // given
            const response = {
                data: {
                    access_token: "access_token-1234",
                    expires_in: 60
                }
            };

            secretService.retrieveSecretsByContext.withArgs("domino.oauth.provider.test", "domino")
                .resolves(providerSecrets);
            axiosRequestStub.resolves(response);

            // when
            await lagsAccessTokenRegistry.getAccessToken(oauthProvider);
            await wait(1000);
            const result = await lagsAccessTokenRegistry.getAccessToken(oauthProvider);

            // then
            expect(result).toEqual(response.data.access_token);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
            sinon.assert.callCount(axiosRequestStub, 2);
        });

        it("should throw exception on missing secret", async () => {

            // given
            secretService.retrieveSecretsByContext.withArgs("domino.oauth.provider.test", "domino")
                .resolves({});

            // when
            const failingCall = () => lagsAccessTokenRegistry.getAccessToken(oauthProvider);

            // then
            // exception expected
            await expect(failingCall).rejects.toThrow(MissingSecretError);
        });
    });

    const providerSecrets = {
        "domino.oauth.provider.test.client-id": "client-id-1",
        "domino.oauth.provider.test.client-secret": "client-secret-1",
        "domino.oauth.provider.test.audience": "audience-1"
    };

    const expectedRequest = createExpectedRequest();

    function createExpectedRequest() {

        const formData = new FormData();
        formData.set("grant_type", "client_credentials");
        formData.set("scope", "read:access:permissions read:access:applications write:access:applications");
        formData.set("client_id", "client-id-1");
        return {
            method: "POST",
            baseURL: "http://localhost:1234",
            url: "/oauth/token",
            data: formData,
            headers: { Authorization: "Basic Y2xpZW50LWlkLTE6Y2xpZW50LXNlY3JldC0x" },
            params: { audience: "audience-1" }
        };
    }
});
