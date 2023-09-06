import { DeploymentRegistry } from "@coordinator/core/config/deployment-config-module";
import { DeploymentFacade } from "@coordinator/core/service/deployment-facade";
import { HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { InfoProvider } from "@coordinator/core/service/info/info-provider";
import { LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { DeploymentStatus, DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";
import {
    deployment,
    deploymentAttributes,
    deploymentInfoResponse,
    deployOperationResult,
    startFailureOperationResult,
    startOperationResult,
    stopOperationResult,
    unknownStartedOperationResult,
    versionedDeploymentAttributes,
    versionedDeployOperationResult
} from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentFacade", () => {

    let deploymentRegistryMock: SinonStubbedInstance<DeploymentRegistry>;
    let lifecycleServiceMock: SinonStubbedInstance<LifecycleService>;
    let healthcheckProviderMock: SinonStubbedInstance<HealthcheckProvider>;
    let infoProviderMock: SinonStubbedInstance<InfoProvider>;
    let deploymentFacade: DeploymentFacade;

    beforeEach(() => {
        deploymentRegistryMock = sinon.createStubInstance(DeploymentRegistry);
        lifecycleServiceMock = sinon.createStubInstance(LifecycleService);
        healthcheckProviderMock = sinon.createStubInstance(HealthcheckProvider);
        infoProviderMock = sinon.createStubInstance(InfoProvider);
        deploymentFacade = new DeploymentFacade(deploymentRegistryMock, lifecycleServiceMock, healthcheckProviderMock, infoProviderMock);
    });

    describe("Test scenarios for #info", () => {

        it("should return deployment info", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            infoProviderMock.getAppInfo.withArgs(deployment.id, deployment.info).resolves(deploymentInfoResponse);

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

            deploymentRegistryMock.getDeployment.withArgs(versionedDeploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.deploy.withArgs(deployment, expectedVersion).resolves(versionedDeployOperationResult);

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

            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.deploy.withArgs(deployment, expectedVersion).resolves(deployOperationResult);

            // when
            const result = await deploymentFacade.deploy(deploymentAttributes);

            // then
            expect(result).toStrictEqual(deployOperationResult);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.start.withArgs(deployment).resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(deployment.id, deployment.healthcheck).resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.start(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and ignore healthcheck on any other status", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.start.withArgs(deployment).resolves(startFailureOperationResult);

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
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.stop.withArgs(deployment).resolves(stopOperationResult);

            // when
            const result = await deploymentFacade.stop(deploymentAttributes);

            // then
            expect(result).toStrictEqual(stopOperationResult);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.restart.withArgs(deployment).resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(deployment.id, deployment.healthcheck).resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.restart(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and ignore healthcheck on any other status", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(deploymentAttributes.deployment).returns(deployment);
            lifecycleServiceMock.restart.withArgs(deployment).resolves(startFailureOperationResult);

            // when
            const result = await deploymentFacade.restart(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);

            sinon.assert.notCalled(healthcheckProviderMock.executeHealthcheck);
        });
    });
});
