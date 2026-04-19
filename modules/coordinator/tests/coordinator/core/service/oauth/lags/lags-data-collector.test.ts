import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import { MissingOAuthApplicationError, MissingOAuthPermissionError } from "@coordinator/core/error/error-types";
import {
    OAuthApplicationSummaryModel,
    PermissionModel,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags";
import { LAGSDataCollector } from "@coordinator/core/service/oauth/lags/lags-data-collector";

describe("Unit tests for LAGSDataCollector", () => {

    let lagsDataCollector: LAGSDataCollector;

    beforeEach(() => {
        lagsDataCollector = new LAGSDataCollector();
    });

    describe("Test scenarios for #identifyClientApplications", () => {

        it("should return map of identified client applications", () => {

            // given
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "app2", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;

            const descriptor = {
                resourceServer: {
                    allowedClients: [
                        { name: "app2" },
                        { name: "app4" }
                    ]
                }
            } as OAuthDescriptor;

            const expectedResult = new Map<string, string>([
                ["app2", "id-2"],
                ["app4", "id-4"]
            ]);

            // when
            const result = lagsDataCollector.identifyClientApplications(applications, descriptor);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should return empty map for an application without clients", () => {

            // given
            const applications = {
                content: [
                    { name: "app1", id: "id-1" },
                    { name: "app2", id: "id-2" },
                    { name: "app3", id: "id-3" },
                    { name: "app4", id: "id-4" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;

            const descriptor = {} as OAuthDescriptor;

            const expectedResult = new Map<string, string>();

            // when
            const result = lagsDataCollector.identifyClientApplications(applications, descriptor);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should throw error on missing client application", () => {

            // given
            const applications = {
                content: [
                    { name: "app1", id: "id-1" }
                ]
            } as SimplifiedPageModel<OAuthApplicationSummaryModel>;

            const descriptor = {
                resourceServer: {
                    allowedClients: [
                        { name: "app4" }
                    ]
                }
            } as OAuthDescriptor;

            // when
            const failingCall = () => lagsDataCollector.identifyClientApplications(applications, descriptor);

            // then
            // exception expected
            expect(failingCall).toThrow(MissingOAuthApplicationError);
        });
    });

    describe("Test scenarios for #identifyPermissions", () => {

        it("should return map of identified permissions for client application", () => {

            // given
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" }
                ]
            } as SimplifiedPageModel<PermissionModel>;

            const descriptor = {
                client: {
                    requiredPermissions: [
                        "permission1",
                        "permission2",
                        "permission4"
                    ]
                }
            } as OAuthDescriptor;

            const expectedResult = new Map<string, string>([
                ["permission1", "id-1"],
                ["permission2", "id-2"],
                ["permission4", "id-4"]
            ]);

            // when
            const result = lagsDataCollector.identifyPermissions(permissions, descriptor);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should return map of identified permissions for resource server application", () => {

            // given
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission4", id: "id-4" },
                    { name: "permission5", id: "id-5" },
                    { name: "permission6", id: "id-6" }
                ]
            } as SimplifiedPageModel<PermissionModel>;

            const descriptor = {
                resourceServer: {
                    registeredPermissions: [
                        "permission1",
                        "permission2",
                        "permission4",
                        "permission6"
                    ],
                    allowedClients: [
                        { allowedPermissions: ["permission1", "permission2"] },
                        { allowedPermissions: ["permission4"] },
                        { allowedPermissions: ["permission6"] }
                    ]
                }
            } as OAuthDescriptor;

            const expectedResult = new Map<string, string>([
                ["permission1", "id-1"],
                ["permission2", "id-2"],
                ["permission4", "id-4"],
                ["permission6", "id-6"]
            ]);

            // when
            const result = lagsDataCollector.identifyPermissions(permissions, descriptor);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should throw error on missing permission", () => {

            // given
            const permissions = {
                content: [
                    { name: "permission1", id: "id-1" },
                    { name: "permission2", id: "id-2" },
                    { name: "permission3", id: "id-3" },
                    { name: "permission6", id: "id-6" }
                ]
            } as SimplifiedPageModel<PermissionModel>;

            const descriptor = {
                resourceServer: {
                    registeredPermissions: [
                        "permission1",
                        "permission2",
                        "permission4",
                        "permission6"
                    ],
                    allowedClients: [
                        { allowedPermissions: ["permission1", "permission2"] },
                        { allowedPermissions: ["permission4"] },
                        { allowedPermissions: ["permission6"] }
                    ]
                }
            } as OAuthDescriptor;

            // when
            const failingCall = () => lagsDataCollector.identifyPermissions(permissions, descriptor);

            // then
            expect(failingCall).toThrow(MissingOAuthPermissionError);
        });
    });
});
