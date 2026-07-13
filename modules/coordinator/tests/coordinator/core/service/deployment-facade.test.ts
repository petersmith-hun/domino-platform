import { OperationQueue } from "@coordinator/core/domain/operation-queue";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { DeploymentFacade } from "@coordinator/core/service/deployment-facade";
import { HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { InfoProvider } from "@coordinator/core/service/info/info-provider";
import { DeploymentInstanceResolver } from "@coordinator/core/service/instances/deployment-instance-resolver";
import { LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { DeploymentStatus, DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";
import {
    deploymentAttributes,
    deploymentInfoResponse,
    deployOperationResult,
    extendedDeployment,
    extendedDeploymentPrimary,
    extendedDeploymentStandby,
    rollingDeploymentAttributes,
    startFailureOperationResult,
    startOperationResult,
    stopOperationResult,
    unknownStartedOperationResult,
    versionedDeploymentAttributes,
    versionedDeployOperationResult
} from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentFacade", () => {

    let deploymentInstanceResolver: SinonStubbedInstance<DeploymentInstanceResolver>;
    let lifecycleServiceMock: SinonStubbedInstance<LifecycleService>;
    let healthcheckProviderMock: SinonStubbedInstance<HealthcheckProvider>;
    let infoProviderMock: SinonStubbedInstance<InfoProvider>;
    let deploymentFacade: DeploymentFacade;

    beforeEach(() => {
        deploymentInstanceResolver = sinon.createStubInstance(DeploymentInstanceResolver);
        lifecycleServiceMock = sinon.createStubInstance(LifecycleService);
        healthcheckProviderMock = sinon.createStubInstance(HealthcheckProvider);
        infoProviderMock = sinon.createStubInstance(InfoProvider);
        deploymentFacade = new DeploymentFacade(deploymentInstanceResolver, lifecycleServiceMock, healthcheckProviderMock, infoProviderMock);
    });

    describe("Test scenarios for #info", () => {

        it("should return deployment info", async () => {

            // given
            deploymentInstanceResolver.resolveSingleInstance.withArgs(deploymentAttributes)
                .resolves(extendedDeployment);
            infoProviderMock.getAppInfo.withArgs(extendedDeployment.id, extendedDeployment.info)
                .resolves(deploymentInfoResponse);

            // when
            const result = await deploymentFacade.info(deploymentAttributes);

            // then
            expect(result).toStrictEqual(deploymentInfoResponse);
        });
    });

    describe("Test scenarios for #deploy", () => {

        it("should request deployment with exact version", async () => {

            // given
            const expectedVersion: DeploymentVersion = {
                version: versionedDeploymentAttributes.version,
                versionType: DeploymentVersionType.EXACT
            }

            deploymentInstanceResolver.resolveInstances.withArgs(versionedDeploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.deploy.withArgs(extendedDeployment, expectedVersion)
                .resolves(versionedDeployOperationResult);

            // when
            const result = await deploymentFacade.deploy(versionedDeploymentAttributes);

            // then
            expect(result).toStrictEqual(versionedDeployOperationResult);
        });

        it("should request deployment with latest version", async () => {

            // given
            const expectedVersion: DeploymentVersion = {
                version: undefined,
                versionType: DeploymentVersionType.LATEST
            }

            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.deploy.withArgs(extendedDeployment, expectedVersion)
                .resolves(deployOperationResult);

            // when
            const result = await deploymentFacade.deploy(deploymentAttributes);

            // then
            expect(result).toStrictEqual(deployOperationResult);
        });

        it("should request rolling deployment with latest version", async () => {

            // given
            const expectedVersion: DeploymentVersion = {
                version: undefined,
                versionType: DeploymentVersionType.LATEST
            }

            deploymentInstanceResolver.resolveInstances.withArgs(rollingDeploymentAttributes)
                .resolves([extendedDeploymentPrimary, extendedDeploymentStandby]);

            lifecycleServiceMock.deploy.withArgs(extendedDeploymentPrimary, expectedVersion)
                .resolves(deployOperationResult);
            lifecycleServiceMock.start.withArgs(extendedDeploymentPrimary)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck
                .withArgs(extendedDeploymentPrimary.id, extendedDeploymentPrimary.healthcheck)
                .resolves(startOperationResult.status);

            lifecycleServiceMock.deploy.withArgs(extendedDeploymentStandby, expectedVersion)
                .resolves(deployOperationResult);
            lifecycleServiceMock.start.withArgs(extendedDeploymentStandby)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck
                .withArgs(extendedDeploymentStandby.id, extendedDeploymentStandby.healthcheck)
                .resolves(startOperationResult.status);

            // when
            const result = await deploymentFacade.deploy(rollingDeploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should rolling deployment immediately stop on any error", async () => {

            // given
            const expectedVersion: DeploymentVersion = {
                version: undefined,
                versionType: DeploymentVersionType.LATEST
            }

            deploymentInstanceResolver.resolveInstances.withArgs(rollingDeploymentAttributes)
                .resolves([extendedDeploymentPrimary, extendedDeploymentStandby]);

            lifecycleServiceMock.deploy.withArgs(extendedDeploymentPrimary, expectedVersion)
                .resolves(deployOperationResult);
            lifecycleServiceMock.start.withArgs(extendedDeploymentPrimary)
                .resolves(startFailureOperationResult);

            // when
            const result = await deploymentFacade.deploy(rollingDeploymentAttributes);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);
        });

        it("should throw error on requesting deployment of non-existing application", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .rejects(new UnknownDeploymentError("app"));

            // when
            const failingCall = () => deploymentFacade.deploy(deploymentAttributes);

            // then
            await expect(failingCall).rejects.toThrow(UnknownDeploymentError);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.start.withArgs(extendedDeployment)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(extendedDeployment.id, extendedDeployment.healthcheck)
                .resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.start(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status for all instances", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(rollingDeploymentAttributes)
                .resolves([extendedDeploymentPrimary, extendedDeploymentStandby]);

            lifecycleServiceMock.start.withArgs(extendedDeploymentPrimary)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(extendedDeploymentPrimary.id, extendedDeploymentPrimary.healthcheck)
                .resolves(DeploymentStatus.HEALTH_CHECK_OK);

            lifecycleServiceMock.start.withArgs(extendedDeploymentStandby)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(extendedDeploymentStandby.id, extendedDeploymentStandby.healthcheck)
                .resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.start(rollingDeploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and ignore healthcheck on any other status", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.start.withArgs(extendedDeployment)
                .resolves(startFailureOperationResult);

            // when
            const result = await deploymentFacade.start(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);

            sinon.assert.notCalled(healthcheckProviderMock.executeHealthcheck);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should execute operation", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.stop.withArgs(extendedDeployment)
                .resolves(stopOperationResult);

            // when
            const result = await deploymentFacade.stop(deploymentAttributes);

            // then
            expect(result).toStrictEqual(stopOperationResult);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.restart.withArgs(extendedDeployment)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(extendedDeployment.id, extendedDeployment.healthcheck)
                .resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.restart(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and ignore healthcheck on any other status", async () => {

            // given
            deploymentInstanceResolver.resolveInstances.withArgs(deploymentAttributes)
                .resolves([extendedDeployment]);
            lifecycleServiceMock.restart.withArgs(extendedDeployment)
                .resolves(startFailureOperationResult);

            // when
            const result = await deploymentFacade.restart(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);

            sinon.assert.notCalled(healthcheckProviderMock.executeHealthcheck);
        });
    });

    describe("Additional test scenarios for OperationQueue", () => {

        it("should throw error on requesting last operation result before executing the queue", () => {

            // given
            const notStartedQueue = OperationQueue.create("test");

            // when
            const failingCall = () => notStartedQueue.lastOperationResult;

            // then
            expect(failingCall).toThrow("No lifecycle operation result available for deployment [test]");
        });

        it("should throw error on executing the queue before populating it", async () => {

            // given
            const emptyQueue = OperationQueue.create("test");

            // when
            const failingCall = () => emptyQueue.execute();

            // then
            await expect(failingCall).rejects.toThrow("No lifecycle operations to execute");
        });

        it("should throw error on executing the queue with an empty step in it", async () => {

            // given
            const invalidQueue = OperationQueue.create("test");
            invalidQueue.enqueue(() => Promise.resolve(startOperationResult));
            // @ts-ignore
            invalidQueue.enqueue(null);

            // when
            const failingCall = () => invalidQueue.execute();

            // then
            await expect(failingCall).rejects.toThrow("Lifecycle operation not found");
        });
    });
});
