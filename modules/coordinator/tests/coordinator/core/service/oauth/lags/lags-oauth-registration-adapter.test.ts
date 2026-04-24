import { OAuthDescriptor, ProviderSecret } from "@coordinator/core/domain/oauth";
import { MissingOAuthApplicationError, OAuthRegistrationError } from "@coordinator/core/error/error-types";
import { OAuthProviderType, RegistrationResult } from "@coordinator/core/service/oauth";
import {
    OAuthApplicationModel,
    OAuthApplicationRegistrationRequest,
    OAuthApplicationRegistrationResponse,
    OAuthApplicationSummaryModel,
    PermissionModel,
    RegistrationContext,
    RegistrationType,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags";
import { LAGSClient } from "@coordinator/core/service/oauth/lags/lags-client";
import { LAGSDataCollector } from "@coordinator/core/service/oauth/lags/lags-data-collector";
import { LAGSOAuthRegistrationAdapter } from "@coordinator/core/service/oauth/lags/lags-oauth-registration-adapter";
import { LAGSRegistrationRequestFactory } from "@coordinator/core/service/oauth/lags/lags-registration-request-factory";
import {
    clientApplicationOAuthDescriptor,
    clientApplicationOAuthDescriptorNoRollingSecret,
    oauthProvider,
    resourceServerApplicationOAuthDescriptor
} from "@testdata/core";
import * as yaml from "js-yaml";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for LAGSOAuthRegistrationAdapter", () => {

    let lagsClientMock: SinonStubbedInstance<LAGSClient>;
    let lagsDataCollectorMock: SinonStubbedInstance<LAGSDataCollector>;
    let lagsRegistrationRequestFactoryMock: SinonStubbedInstance<LAGSRegistrationRequestFactory>;
    let lagsOAuthRegistrationAdapter: LAGSOAuthRegistrationAdapter;

    beforeEach(() => {
        lagsClientMock = sinon.createStubInstance(LAGSClient);
        lagsDataCollectorMock = sinon.createStubInstance(LAGSDataCollector);
        lagsRegistrationRequestFactoryMock = sinon.createStubInstance(LAGSRegistrationRequestFactory);
        lagsOAuthRegistrationAdapter = new LAGSOAuthRegistrationAdapter(lagsClientMock, lagsDataCollectorMock, lagsRegistrationRequestFactoryMock);
    });

    describe("Test scenarios for #register", () => {

        it("should register new application", async () => {

            // given
            const descriptor = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "app2", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" }
                ]
            } as SimplifiedPageModel<PermissionModel>;
            const context = new RegistrationContext({
                name: "myservice",
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["myservice"]),
                applicationMap: new Map<string, string>([
                    ["client-1", "id-client-1"],
                    ["client-2", "id-client-2"]
                ]),
                permissionMap: new Map<string, string>([
                    ["permission1", "id-permission-1"],
                    ["permission2", "id-permission-2"]
                ])
            });
            const request = {
                name: "myservice",
                registrationType: RegistrationType.RESOURCE_SERVER,
                clientID: "client-ID-1",
                resourceServer: {
                    audience: "aud-1"
                }
            } as OAuthApplicationRegistrationRequest;
            const response = {
                id: "id-5",
                clientSecret: "abcd1234"
            } as OAuthApplicationRegistrationResponse;

            const expectedResult = {
                secrets: new Map<ProviderSecret, string>([
                    ["client-id", "client-ID-1"],
                    ["audience", "aud-1"],
                    ["client-secret", "abcd1234"]
                ])
            } as RegistrationResult;

            lagsClientMock.getAllApplications.withArgs(oauthProvider).resolves(applications);
            lagsClientMock.getAllPermissions.withArgs(oauthProvider).resolves(permissions);
            lagsDataCollectorMock.identifyClientApplications.withArgs(applications, context.descriptor).returns(context.applicationMap);
            lagsDataCollectorMock.identifyPermissions.withArgs(permissions, context.descriptor).returns(context.permissionMap);
            lagsRegistrationRequestFactoryMock.createRequest.withArgs(context).returns(request);
            lagsClientMock.createApplication.withArgs(oauthProvider, request).resolves(response);

            // when
            const result = await lagsOAuthRegistrationAdapter.register(oauthProvider, "myservice", context.descriptor, false);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should not submit request in dry-run mode", async () => {

            // given
            const descriptor = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "app2", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" }
                ]
            } as SimplifiedPageModel<PermissionModel>;
            const context = new RegistrationContext({
                name: "myservice",
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["myservice"]),
                applicationMap: new Map<string, string>([
                    ["client-1", "id-client-1"],
                    ["client-2", "id-client-2"]
                ]),
                permissionMap: new Map<string, string>([
                    ["permission1", "id-permission-1"],
                    ["permission2", "id-permission-2"]
                ])
            });
            const request = {
                name: "myservice",
                registrationType: RegistrationType.RESOURCE_SERVER,
                clientID: "client-ID-1",
                resourceServer: {
                    audience: "aud-1"
                }
            } as OAuthApplicationRegistrationRequest;

            const expectedResult = {
                secrets: new Map<ProviderSecret, string>([
                    ["client-id", "client-ID-1"],
                    ["audience", "aud-1"]
                ])
            } as RegistrationResult;

            lagsClientMock.getAllApplications.withArgs(oauthProvider).resolves(applications);
            lagsClientMock.getAllPermissions.withArgs(oauthProvider).resolves(permissions);
            lagsDataCollectorMock.identifyClientApplications.withArgs(applications, context.descriptor).returns(context.applicationMap);
            lagsDataCollectorMock.identifyPermissions.withArgs(permissions, context.descriptor).returns(context.permissionMap);
            lagsRegistrationRequestFactoryMock.createRequest.withArgs(context).returns(request);

            // when
            const result = await lagsOAuthRegistrationAdapter.register(oauthProvider, "myservice", context.descriptor, true);

            // then
            expect(result).toStrictEqual(expectedResult);

            sinon.assert.notCalled(lagsClientMock.createApplication);
            sinon.assert.notCalled(lagsClientMock.editApplication);
        });

        it("should overwrite existing application", async () => {

            // given
            const descriptor = yaml.load(clientApplicationOAuthDescriptor) as any;
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "test-app", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" }
                ]
            } as SimplifiedPageModel<PermissionModel>;
            const context = new RegistrationContext({
                name: "test-app",
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["test-app"]),
                applicationMap: new Map<string, string>([
                    ["client-1", "id-client-1"],
                    ["client-2", "id-client-2"]
                ]),
                permissionMap: new Map<string, string>([
                    ["permission1", "id-permission-1"],
                    ["permission2", "id-permission-2"]
                ]),
                registeredApplication: {
                    id: "id-2",
                    name: "test-app"
                } as OAuthApplicationModel
            });
            const request = {
                name: "test-app",
                registrationType: RegistrationType.CLIENT,
                clientID: "client-ID-1"
            } as OAuthApplicationRegistrationRequest;
            const response = {
                id: "id-2"
            } as OAuthApplicationRegistrationResponse;

            const expectedResult = {
                secrets: new Map<ProviderSecret, string>([
                    ["client-secret", "new-secret-1234"]
                ])
            } as RegistrationResult;

            lagsClientMock.getAllApplications.withArgs(oauthProvider).resolves(applications);
            lagsClientMock.getAllPermissions.withArgs(oauthProvider).resolves(permissions);
            lagsClientMock.getApplicationByID.withArgs(oauthProvider, "id-2").resolves(context.registeredApplication);
            lagsClientMock.regenerateApplicationSecret.withArgs(oauthProvider, "id-2").resolves({
                id: "id-2",
                clientSecret: "new-secret-1234"
            });
            lagsDataCollectorMock.identifyClientApplications.withArgs(applications, context.descriptor).returns(context.applicationMap);
            lagsDataCollectorMock.identifyPermissions.withArgs(permissions, context.descriptor).returns(context.permissionMap);
            lagsRegistrationRequestFactoryMock.createRequest.withArgs(context).returns(request);
            lagsClientMock.editApplication.withArgs(oauthProvider, "id-2", request).resolves(response);

            // when
            const result = await lagsOAuthRegistrationAdapter.register(oauthProvider, "test-app", context.descriptor, false);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should overwrite existing application without rolling the secret", async () => {

            // given
            const descriptor = yaml.load(clientApplicationOAuthDescriptorNoRollingSecret) as any;
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "test-app", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" }
                ]
            } as SimplifiedPageModel<PermissionModel>;
            const context = new RegistrationContext({
                name: "test-app",
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["test-app"]),
                applicationMap: new Map<string, string>([
                    ["client-1", "id-client-1"],
                    ["client-2", "id-client-2"]
                ]),
                permissionMap: new Map<string, string>([
                    ["permission1", "id-permission-1"],
                    ["permission2", "id-permission-2"]
                ]),
                registeredApplication: {
                    id: "id-2",
                    name: "test-app"
                } as OAuthApplicationModel
            });
            const request = {
                name: "test-app",
                registrationType: RegistrationType.CLIENT,
                clientID: "client-ID-1",
            } as OAuthApplicationRegistrationRequest;
            const response = {
                id: "id-2"
            } as OAuthApplicationRegistrationResponse;

            const expectedResult = {
                secrets: new Map<ProviderSecret, string>()
            } as RegistrationResult;

            lagsClientMock.getAllApplications.withArgs(oauthProvider).resolves(applications);
            lagsClientMock.getAllPermissions.withArgs(oauthProvider).resolves(permissions);
            lagsClientMock.getApplicationByID.withArgs(oauthProvider, "id-2").resolves(context.registeredApplication);
            lagsDataCollectorMock.identifyClientApplications.withArgs(applications, context.descriptor).returns(context.applicationMap);
            lagsDataCollectorMock.identifyPermissions.withArgs(permissions, context.descriptor).returns(context.permissionMap);
            lagsRegistrationRequestFactoryMock.createRequest.withArgs(context).returns(request);
            lagsClientMock.editApplication.withArgs(oauthProvider, "id-2", request).resolves(response);

            // when
            const result = await lagsOAuthRegistrationAdapter.register(oauthProvider, "test-app", context.descriptor, false);

            // then
            expect(result).toStrictEqual(expectedResult);

            sinon.assert.notCalled(lagsClientMock.regenerateApplicationSecret);
        });

        it("should throw OAuthRegistrationError on unidentified error", async () => {

            // given
            const descriptorRaw = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const descriptor = new OAuthDescriptor(descriptorRaw.domino.oauth["myservice"]);

            lagsClientMock.getAllApplications.withArgs(oauthProvider).rejects(new Error("Something went wrong"));

            // when
            const failingCall = () => lagsOAuthRegistrationAdapter.register(oauthProvider, "myservice", descriptor, false);

            // then
            // exception expected
            await expect(failingCall).rejects.toThrow(OAuthRegistrationError);
        });

        it("should throw MissingOAuth*Error on identification error", async () => {

            // given
            const descriptorRaw = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const descriptor = new OAuthDescriptor(descriptorRaw.domino.oauth["myservice"]);

            lagsClientMock.getAllApplications.withArgs(oauthProvider).rejects(new MissingOAuthApplicationError("app"));

            // when
            const failingCall = () => lagsOAuthRegistrationAdapter.register(oauthProvider, "myservice", descriptor, false);

            // then
            // exception expected
            await expect(failingCall).rejects.toThrow(MissingOAuthApplicationError);
        });
    });

    describe("Test scenarios for #forProviderType", () => {

        it("should always return LAGS", () => {

            // when
            const result = lagsOAuthRegistrationAdapter.forProviderType();

            // then
            expect(result).toStrictEqual(OAuthProviderType.LAGS);
        });
    });
});
