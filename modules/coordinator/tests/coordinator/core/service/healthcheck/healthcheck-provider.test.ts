import { Attempt } from "@coordinator/core/service/healthcheck";
import { HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { HealthcheckResponseProcessor } from "@coordinator/core/service/healthcheck/healthcheck-response-processor";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { axiosHealthcheckRequest, deploymentHealthcheck, optionalDeploymentHealthcheck } from "@testdata/core";
import axios, { AxiosResponse } from "axios";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for HealthcheckProvider", () => {

    const deploymentID = "app";
    let requestStub: SinonStub;
    let axiosResponseStub: AxiosResponse<object>;
    let healthcheckResponseProcessorMock: SinonStubbedInstance<HealthcheckResponseProcessor>;
    let healthcheckProvider: HealthcheckProvider;

    beforeAll(async () => {
        requestStub = sinon.stub(axios, "request");
    });

    beforeEach(() => {
        axiosResponseStub = { data: {}, status: HttpStatus.OK } as AxiosResponse<object>
        healthcheckResponseProcessorMock = sinon.createStubInstance(HealthcheckResponseProcessor);
        healthcheckProvider = new HealthcheckProvider(healthcheckResponseProcessorMock);
    });

    afterAll(() => {
        requestStub.restore();
    });

    describe("Test scenarios for #executeHealthcheck", () => {

        it("should return HEALTH_CHECK_OK on successful request on first attempt", async () => {

            // given
            requestStub.withArgs(axiosHealthcheckRequest).resolves(axiosResponseStub);
            healthcheckResponseProcessorMock.handleResponse.resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, optionalDeploymentHealthcheck);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_OK);
            sinon.assert.calledWith(healthcheckResponseProcessorMock.handleResponse, deploymentID, HttpStatus.OK, prepareAttempt(1));
        });

        it("should return HEALTH_CHECK_OK on successful request on last attempt", async () => {

            // given
            requestStub.withArgs(axiosHealthcheckRequest).resolves(axiosResponseStub);
            healthcheckResponseProcessorMock.handleResponse
                .onFirstCall().resolves(undefined)
                .onSecondCall().resolves(undefined)
                .onThirdCall().resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, optionalDeploymentHealthcheck);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_OK);
            sinon.assert.calledWith(healthcheckResponseProcessorMock.handleResponse, deploymentID, HttpStatus.OK, prepareAttempt(3));
        });

        it("should return HEALTH_CHECK_FAILURE on reaching attempt limit and not getting successful response", async () => {

            // given
            requestStub.withArgs(axiosHealthcheckRequest).resolves(axiosResponseStub);
            healthcheckResponseProcessorMock.handleResponse.resolves(undefined);

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, optionalDeploymentHealthcheck);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_FAILURE);
            sinon.assert.calledWith(healthcheckResponseProcessorMock.handleResponse, deploymentID, HttpStatus.OK, prepareAttempt(3));
        });

        it("should return HEALTH_CHECK_FAILURE if response processor returns with that", async () => {

            // given
            requestStub.withArgs(axiosHealthcheckRequest).resolves(axiosResponseStub);
            healthcheckResponseProcessorMock.handleResponse
                .onFirstCall().resolves(undefined)
                .onSecondCall().resolves(DeploymentStatus.HEALTH_CHECK_FAILURE);

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, optionalDeploymentHealthcheck);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_FAILURE);
            sinon.assert.calledWith(healthcheckResponseProcessorMock.handleResponse, deploymentID, HttpStatus.OK, prepareAttempt(2));
        });

        it("should return UNKNOWN_STARTED on non-configured healthcheck", async () => {

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, { enabled: false });

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should handle request error using the response processor", async () => {

            // given
            requestStub.withArgs(axiosHealthcheckRequest).rejects(new Error("Something went wrong"));
            healthcheckResponseProcessorMock.handleResponse.resolves(DeploymentStatus.HEALTH_CHECK_FAILURE);

            // when
            const result = await healthcheckProvider.executeHealthcheck(deploymentID, optionalDeploymentHealthcheck);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_FAILURE);
            sinon.assert.calledWith(healthcheckResponseProcessorMock.handleResponse, deploymentID, HttpStatus.SERVICE_UNAVAILABLE, prepareAttempt(1));
        });

        function prepareAttempt(attemptedTimes: number): Attempt {

            const attempt = new Attempt(deploymentHealthcheck);
            for (let index = 0; index < attemptedTimes; index++) {
                attempt.attempted();
            }

            expect(attempt.attemptsLeft).toBe(deploymentHealthcheck.maxAttempts - attemptedTimes);
            expect(attempt.isLimitReached()).toBe(deploymentHealthcheck.maxAttempts === attemptedTimes);

            return attempt;
        }
    });
});
