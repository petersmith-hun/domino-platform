import {
    OAuthApplicationModel,
    OAuthApplicationRegistrationRequest,
    OAuthApplicationSummaryModel,
    PermissionModel,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags";
import { LAGSAccessTokenRegistry } from "@coordinator/core/service/oauth/lags/lags-access-token-registry";
import { LAGSClient } from "@coordinator/core/service/oauth/lags/lags-client";
import { lagsAccessToken, oauthProvider } from "@testdata/core";
import axios, { AxiosResponse } from "axios";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for LAGSClient", () => {

    let axiosRequestStub: sinon.SinonStub;
    let lagsAccessTokenRegistryMock: SinonStubbedInstance<LAGSAccessTokenRegistry>;
    let lagsClient: LAGSClient;

    beforeAll(() => {
        axiosRequestStub = sinon.stub(axios, "request");
    });

    beforeEach(() => {
        lagsAccessTokenRegistryMock = sinon.createStubInstance(LAGSAccessTokenRegistry);
        lagsClient = new LAGSClient(lagsAccessTokenRegistryMock);
    });

    afterEach(() => {
        axiosRequestStub.reset();
    });

    describe("Test scenarios for #getAllPermissions", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const data: SimplifiedPageModel<PermissionModel> = {
                content: [],
                page: { size: 10, number: 1, totalPages: 2, totalElements: 15}
            }

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: "/access-management/permissions",
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { page: 0 },
                data: undefined,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.getAllPermissions(oauthProvider);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    describe("Test scenarios for #getAllApplications", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const data: SimplifiedPageModel<OAuthApplicationSummaryModel> = {
                content: [],
                page: { size: 10, number: 1, totalPages: 2, totalElements: 15}
            }

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: "/access-management/oauth-applications",
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { page: 0 },
                data: undefined,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.getAllApplications(oauthProvider);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    describe("Test scenarios for #getApplicationByID", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const id = "d95cc2ad-6c52-4e87-a1c0-39ff92d00b47";
            const data: OAuthApplicationModel = { name: "app1" } as OAuthApplicationModel;

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: `/access-management/oauth-applications/${id}`,
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { },
                data: undefined,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.getApplicationByID(oauthProvider, id);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    describe("Test scenarios for #createApplication", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const request = { name: "app1", clientID: "client-id-1" } as OAuthApplicationRegistrationRequest;
            const data = { name: "app1" } as OAuthApplicationModel;

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: `/access-management/oauth-applications`,
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { },
                data: request,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.createApplication(oauthProvider, request);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    describe("Test scenarios for #editApplication", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const id = "d95cc2ad-6c52-4e87-a1c0-39ff92d00b47";
            const request = { name: "app1", clientID: "client-id-1" } as OAuthApplicationRegistrationRequest;
            const data = { name: "app1" } as OAuthApplicationModel;

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: `/access-management/oauth-applications/${id}`,
                method: "put",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { },
                data: request,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.editApplication(oauthProvider, id, request);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    describe("Test scenarios for #getApplicationByID", () => {

        it("should call Domino via an Axios client", async () => {

            // given
            const id = "d95cc2ad-6c52-4e87-a1c0-39ff92d00b47";
            const data: OAuthApplicationModel = { name: "app1" } as OAuthApplicationModel;

            const expectedRequest = {
                baseURL: oauthProvider.host,
                url: `/access-management/oauth-applications/${id}/secret`,
                method: "put",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "Bearer some-token"
                },
                params: { },
                data: undefined,
                responseType: "json"
            }

            lagsAccessTokenRegistryMock.getAccessToken.withArgs(oauthProvider).resolves(lagsAccessToken);
            axiosRequestStub.withArgs(expectedRequest).resolves(createResponse(data));

            // when
            const result = await lagsClient.regenerateApplicationSecret(oauthProvider, id);

            // then
            expect(result).toStrictEqual(data);

            sinon.assert.calledWith(axiosRequestStub, expectedRequest);
        });
    });

    function createResponse<T>(data: T): AxiosResponse<T> {

        // @ts-ignore
        return { data, status: 200 };
    }
});
