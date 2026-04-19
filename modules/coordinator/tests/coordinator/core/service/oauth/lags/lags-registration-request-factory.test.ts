import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import {
    OAuthApplicationModel,
    OAuthApplicationRegistrationRequest,
    RegistrationContext,
    RegistrationType
} from "@coordinator/core/service/oauth/lags";
import { LAGSRegistrationRequestFactory } from "@coordinator/core/service/oauth/lags/lags-registration-request-factory";
import {
    clientApplicationOAuthDescriptor,
    middleResourceServerApplicationOAuthDescriptor,
    resourceServerApplicationOAuthDescriptor
} from "@testdata/core";
import * as yaml from "js-yaml";

describe("Unit tests for LAGSRegistrationRequestFactory", () => {

    let lagsRegistrationRequestFactory: LAGSRegistrationRequestFactory;

    beforeEach(() => {
        lagsRegistrationRequestFactory = new LAGSRegistrationRequestFactory();
    });

    describe("Test scenarios for #createRequest", () => {

        it("should create request for a new client application", () => {

            // given
            const descriptor = yaml.load(clientApplicationOAuthDescriptor) as any;
            const context = new RegistrationContext({
                name: "test-app",
                permissionMap: new Map<string, string>([
                    ["read:permission", "id-1"],
                    ["write:permission", "id-2"],
                ]),
                applicationMap: new Map<string, string>(),
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["test-app"]),
            });

            const expectedRequest = {
                name: "test-app",
                registrationType: RegistrationType.CLIENT,
                client: {
                    allowedCallbacks: [
                        { id: undefined, url: "http://localhost:3000/callback" },
                    ],
                    requiredPermissions: [ "id-1", "id-2" ],
                },
                resourceServer: undefined
            } as OAuthApplicationRegistrationRequest;

            // when
            const result = lagsRegistrationRequestFactory.createRequest(context);

            // then
            assertClientID(result, "localhost-client-test-app-");
            expectedRequest.clientID = result.clientID;
            expect(result).toStrictEqual(expectedRequest);
        });

        it("should create request for an existing client application (update)", () => {

            // given
            const descriptor = yaml.load(clientApplicationOAuthDescriptor) as any;
            const context = new RegistrationContext({
                name: "test-app",
                permissionMap: new Map<string, string>([
                    ["read:permission", "id-1"],
                    ["write:permission", "id-2"],
                ]),
                applicationMap: new Map<string, string>(),
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["test-app"]),
                registeredApplication: {
                    client: {
                        allowedCallbacks: [
                            { id: "callback-id-1", "url": "http://localhost:3000/callback" }
                        ]
                    }
                } as OAuthApplicationModel
            });

            const expectedRequest = {
                name: "test-app",
                registrationType: RegistrationType.CLIENT,
                client: {
                    allowedCallbacks: [
                        { id: "callback-id-1", url: "http://localhost:3000/callback" },
                    ],
                    requiredPermissions: [ "id-1", "id-2" ],
                },
                resourceServer: undefined
            } as OAuthApplicationRegistrationRequest;

            // when
            const result = lagsRegistrationRequestFactory.createRequest(context);

            // then
            assertClientID(result, "localhost-client-test-app-");
            expectedRequest.clientID = result.clientID;
            expect(result).toStrictEqual(expectedRequest);
        });

        it("should create request for a new resource server application", () => {

            // given
            const descriptor = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const context = new RegistrationContext({
                name: "myservice",
                permissionMap: new Map<string, string>([
                    ["read:permission1", "id-1"],
                    ["read:permission2", "id-2"],
                    ["write:permission3", "id-3"],
                ]),
                applicationMap: new Map<string, string>([
                    ["client1", "id-client-1"],
                    ["client2", "id-client-2"]
                ]),
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["myservice"])
            });

            const expectedRequest = {
                name: "myservice",
                registrationType: RegistrationType.RESOURCE_SERVER,
                client: undefined,
                resourceServer: {
                    audience: "myhost:svc:myservice:staging",
                    registeredPermissions: ["id-1", "id-2", "id-3"],
                    allowedClients: [
                        { applicationID: "id-client-1", allowedPermissions: ["id-3"] },
                        { applicationID: "id-client-2", allowedPermissions: ["id-1", "id-2"] }
                    ]
                }
            } as OAuthApplicationRegistrationRequest;

            // when
            const result = lagsRegistrationRequestFactory.createRequest(context);

            // then
            assertClientID(result, "myhost-service-myservice-");
            expectedRequest.clientID = result.clientID;
            expect(result).toStrictEqual(expectedRequest);
        });

        it("should create request for an existing resource server application (update)", () => {

            // given
            const descriptor = yaml.load(resourceServerApplicationOAuthDescriptor) as any;
            const context = new RegistrationContext({
                name: "myservice",
                permissionMap: new Map<string, string>([
                    ["read:permission1", "id-1"],
                    ["read:permission2", "id-2"],
                    ["write:permission3", "id-3"],
                ]),
                applicationMap: new Map<string, string>([
                    ["client1", "id-client-1"],
                    ["client2", "id-client-2"]
                ]),
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["myservice"]),
                registeredApplication: {
                    resourceServer: {
                        audience: "already:existing:audience:value",
                    }
                } as OAuthApplicationModel
            });

            const expectedRequest = {
                name: "myservice",
                registrationType: RegistrationType.RESOURCE_SERVER,
                client: undefined,
                resourceServer: {
                    audience: "already:existing:audience:value",
                    registeredPermissions: ["id-1", "id-2", "id-3"],
                    allowedClients: [
                        { applicationID: "id-client-1", allowedPermissions: ["id-3"] },
                        { applicationID: "id-client-2", allowedPermissions: ["id-1", "id-2"] }
                    ]
                }
            } as OAuthApplicationRegistrationRequest;

            // when
            const result = lagsRegistrationRequestFactory.createRequest(context);

            // then
            assertClientID(result, "myhost-service-myservice-");
            expectedRequest.clientID = result.clientID;
            expect(result).toStrictEqual(expectedRequest);
        });

        it("should create request for a new middle resource application", () => {

            // given
            const descriptor = yaml.load(middleResourceServerApplicationOAuthDescriptor) as any;
            const context = new RegistrationContext({
                name: "middle-resource",
                permissionMap: new Map<string, string>([
                    ["read:permission1", "id-1"],
                    ["read:permission2", "id-2"],
                    ["read:permission4", "id-5"],
                    ["write:permission3", "id-3"],
                    ["write:permission4", "id-4"]
                ]),
                applicationMap: new Map<string, string>([
                    ["client1", "id-client-1"],
                    ["client2", "id-client-2"]
                ]),
                descriptor: new OAuthDescriptor(descriptor.domino.oauth["middle-resource"])
            });

            const expectedRequest = {
                name: "middle-resource",
                registrationType: RegistrationType.MIDDLE_RESOURCE_SERVER,
                client: {
                    allowedCallbacks: [],
                    requiredPermissions: ["id-5", "id-4"],
                },
                resourceServer: {
                    audience: "myhost:svc:middle-resource:staging",
                    registeredPermissions: ["id-1", "id-2", "id-3"],
                    allowedClients: [
                        { applicationID: "id-client-1", allowedPermissions: ["id-3"] },
                        { applicationID: "id-client-2", allowedPermissions: ["id-1", "id-2"] }
                    ]
                }
            } as unknown as OAuthApplicationRegistrationRequest;

            // when
            const result = lagsRegistrationRequestFactory.createRequest(context);

            // then
            assertClientID(result, "myhost-service-middle-resource-");
            expectedRequest.clientID = result.clientID;
            expect(result).toStrictEqual(expectedRequest);
        });
    });

    function assertClientID(request: OAuthApplicationRegistrationRequest, expectedStaticPart: string): void {

        const dynamicPartIndex = request.clientID.length - 4;

        expect(request.clientID.substring(0, dynamicPartIndex)).toBe(expectedStaticPart);
        expect(request.clientID.substring(dynamicPartIndex)).toMatch(/[0-9a-f]{4}/);
    }
});
