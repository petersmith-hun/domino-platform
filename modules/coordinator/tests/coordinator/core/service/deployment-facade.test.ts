import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { DeploymentFacade } from "@coordinator/core/service/deployment-facade";
import { HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { InfoProvider } from "@coordinator/core/service/info/info-provider";
import { LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { DeploymentStatus, DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";
import {
    deploymentAttributes,
    deploymentInfoResponse,
    deployOperationResult,
    extendedDeployment,
    startFailureOperationResult,
    startOperationResult,
    stopOperationResult,
    unknownStartedOperationResult,
    versionedDeploymentAttributes,
    versionedDeployOperationResult
} from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentFacade", () => {

    let deploymentDefinitionServiceMock: SinonStubbedInstance<DeploymentDefinitionService>;
    let lifecycleServiceMock: SinonStubbedInstance<LifecycleService>;
    let healthcheckProviderMock: SinonStubbedInstance<HealthcheckProvider>;
    let infoProviderMock: SinonStubbedInstance<InfoProvider>;
    let deploymentFacade: DeploymentFacade;

    beforeEach(() => {
        deploymentDefinitionServiceMock = sinon.createStubInstance(DeploymentDefinitionService);
        lifecycleServiceMock = sinon.createStubInstance(LifecycleService);
        healthcheckProviderMock = sinon.createStubInstance(HealthcheckProvider);
        infoProviderMock = sinon.createStubInstance(InfoProvider);
        deploymentFacade = new DeploymentFacade(deploymentDefinitionServiceMock, lifecycleServiceMock, healthcheckProviderMock, infoProviderMock);
    });

    describe("Test scenarios for #info", () => {

        it("should return deployment info", async () => {

            // given
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
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

            deploymentDefinitionServiceMock.getDeployment.withArgs(versionedDeploymentAttributes.deployment)
                .resolves(extendedDeployment);
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

            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
            lifecycleServiceMock.deploy.withArgs(extendedDeployment, expectedVersion)
                .resolves(deployOperationResult);

            // when
            const result = await deploymentFacade.deploy(deploymentAttributes);

            // then
            expect(result).toStrictEqual(deployOperationResult);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should execute operation and attempt healthcheck on UNKNOWN_STARTED status", async () => {

            // given
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
            lifecycleServiceMock.start.withArgs(extendedDeployment)
                .resolves(unknownStartedOperationResult);
            healthcheckProviderMock.executeHealthcheck.withArgs(extendedDeployment.id, extendedDeployment.healthcheck)
                .resolves(DeploymentStatus.HEALTH_CHECK_OK);

            // when
            const result = await deploymentFacade.start(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should execute operation and ignore healthcheck on any other status", async () => {

            // given
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
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
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
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
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
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
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentAttributes.deployment)
                .resolves(extendedDeployment);
            lifecycleServiceMock.restart.withArgs(extendedDeployment)
                .resolves(startFailureOperationResult);

            // when
            const result = await deploymentFacade.restart(deploymentAttributes);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);

            sinon.assert.notCalled(healthcheckProviderMock.executeHealthcheck);
        });
    });
});
