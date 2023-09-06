import { DeploymentFacade } from "@coordinator/core/service/deployment-facade";
import { ControllerType } from "@coordinator/web/controller/controller";
import { LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { ResponseWrapper } from "@coordinator/web/model/common";
import { LifecycleRequest, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { HttpStatus } from "@core-lib/platform/api/common";
import {
    deploymentAttributes,
    deploymentInfoResponse,
    deployOperationResult,
    startOperationResult,
    stopOperationResult,
    versionedDeploymentAttributes,
    versionedDeployOperationResult
} from "@testdata/core";
import {
    deployLifecycleResponse,
    lifecycleRequest,
    startLifecycleResponse,
    stopLifecycleResponse,
    versionedDeployLifecycleResponse,
    versionedLifecycleRequest
} from "@testdata/web";
import { Request } from "express";
import { hrtime } from "node:process";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for LifecycleController", () => {

    let deploymentFacadeMock: SinonStubbedInstance<DeploymentFacade>;
    let hrTimeStub: SinonStub;
    let lifecycleController: LifecycleController;

    beforeAll(() => {
        hrTimeStub = sinon.stub(hrtime, "bigint");
        hrTimeStub.returns(BigInt(2_234_000_000));
    });

    beforeEach(() => {
        deploymentFacadeMock = sinon.createStubInstance(DeploymentFacade);
        lifecycleController = new LifecycleController(deploymentFacadeMock);
    });

    afterAll(() => {
        hrTimeStub.restore();
    });

    type Scenario = { deployment: string, version?: string };

    const invalidRequestScenarios: Scenario[] = [
        { deployment: undefined!, version: undefined},
        { deployment: "", version: undefined},
        { deployment: "app+app", version: undefined },
        { deployment: "app1", version: undefined },
        { deployment: "_app", version: undefined },
        { deployment: "app-", version: undefined },
        { deployment: "app", version: "" },
        { deployment: "app", version: "v1" },
        { deployment: "app", version: "1.++" },
        { deployment: "app", version: "1.2.3/4" },
    ];

    describe("Test scenarios for #getInfo", () => {

        it("should return info response", async () => {

            // given
            deploymentFacadeMock.info.withArgs(deploymentAttributes).resolves(deploymentInfoResponse);

            // when
            const result = await lifecycleController.getInfo(lifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.OK, deploymentInfoResponse.info);
        });

        invalidRequestScenarios.slice(0, 6).forEach((scenario: Scenario) => {

            it(`should fail with validation error for scenario: '${scenario.deployment}'`, async () => {

                // given
                const request = new LifecycleRequest({
                    params: scenario
                } as unknown as Request);

                // when
                const failingCall = async () => await lifecycleController.getInfo(request);

                // then
                // exception expected
                await expect(failingCall).rejects.toThrow(InvalidRequestError);
            });
        });
    });

    describe("Test scenarios for #deploy", () => {

        it("should return response with processing time for specific version", async () => {

            // given
            deploymentFacadeMock.deploy.withArgs(versionedDeploymentAttributes).resolves(versionedDeployOperationResult);

            // when
            const result = await lifecycleController.deploy(versionedLifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.CREATED, versionedDeployLifecycleResponse);
        });

        it("should return response with processing time for latest version", async () => {

            // given
            deploymentFacadeMock.deploy.withArgs(deploymentAttributes).resolves(deployOperationResult);

            // when
            const result = await lifecycleController.deploy(lifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.CREATED, deployLifecycleResponse);
        });

        invalidRequestScenarios.forEach((scenario: Scenario) => {

            it(`should fail with validation error for scenario: '${scenario.deployment}/${scenario.version}'`, async () => {

                // given
                const request = new VersionedLifecycleRequest({
                    params: scenario
                } as unknown as Request);

                // when
                const failingCall = async () => await lifecycleController.deploy(request);

                // then
                // exception expected
                await expect(failingCall).rejects.toThrow(InvalidRequestError);
            });
        });
    });

    describe("Test scenarios for #start", () => {

        it("should return response with processing time", async () => {

            // given
            deploymentFacadeMock.start.withArgs(deploymentAttributes).resolves(startOperationResult);

            // when
            const result = await lifecycleController.start(lifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.CREATED, startLifecycleResponse);
        });

        invalidRequestScenarios.slice(0, 6).forEach((scenario: Scenario) => {

            it(`should fail with validation error for scenario: '${scenario.deployment}'`, async () => {

                // given
                const request = new LifecycleRequest({
                    params: scenario
                } as unknown as Request);

                // when
                const failingCall = async () => await lifecycleController.start(request);

                // then
                // exception expected
                await expect(failingCall).rejects.toThrow(InvalidRequestError);
            });
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should return response with processing time", async () => {

            // given
            deploymentFacadeMock.stop.withArgs(deploymentAttributes).resolves(stopOperationResult);

            // when
            const result = await lifecycleController.stop(lifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.ACCEPTED, stopLifecycleResponse);
        });

        invalidRequestScenarios.slice(0, 6).forEach((scenario: Scenario) => {

            it(`should fail with validation error for scenario: '${scenario.deployment}'`, async () => {

                // given
                const request = new LifecycleRequest({
                    params: scenario
                } as unknown as Request);

                // when
                const failingCall = async () => await lifecycleController.stop(request);

                // then
                // exception expected
                await expect(failingCall).rejects.toThrow(InvalidRequestError);
            });
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should return response with processing time", async () => {

            // given
            deploymentFacadeMock.restart.withArgs(deploymentAttributes).resolves(startOperationResult);

            // when
            const result = await lifecycleController.restart(lifecycleRequest);

            // then
            assertLifecycleResponse(result, HttpStatus.CREATED, startLifecycleResponse);
        });

        invalidRequestScenarios.slice(0, 6).forEach((scenario: Scenario) => {

            it(`should fail with validation error for scenario: '${scenario.deployment}'`, async () => {

                // given
                const request = new LifecycleRequest({
                    params: scenario
                } as unknown as Request);

                // when
                const failingCall = async () => await lifecycleController.restart(request);

                // then
                // exception expected
                await expect(failingCall).rejects.toThrow(InvalidRequestError);
            });
        });
    });

    function assertLifecycleResponse(result: ResponseWrapper<any>, expectedStatus: HttpStatus, expectedContent: any): void {

        expect(result.status).toBe(expectedStatus);
        expect(result.content).toStrictEqual(expectedContent);
    }

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.LIFECYCLE", () => {

            // when
            const result = lifecycleController.controllerType();

            // then
            expect(result).toBe(ControllerType.LIFECYCLE);
        });
    });
});
