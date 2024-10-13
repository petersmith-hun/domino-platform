import { DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { DeploymentDefinition } from "@coordinator/core/domain/storage";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { pagedDeployments, pagedDeploymentSummaries } from "@testdata/core";
import {
    dockerAllArgsDeployment,
    dockerAllArgsDeploymentDefinition,
    dockerAllArgsDeploymentDefinitionUnlocked,
    dockerAllArgsDeploymentModified,
    extendedDockerAllArgsDeployment
} from "@testdata/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentDefinitionService", () => {

    let deploymentDefinitionDAOMock: SinonStubbedInstance<DeploymentDefinitionDAO>;
    let storedDefinitionMock: SinonStubbedInstance<DeploymentDefinition>;
    let deploymentDefinitionService: DeploymentDefinitionService;

    beforeEach(() => {
        deploymentDefinitionDAOMock = sinon.createStubInstance(DeploymentDefinitionDAO);
        storedDefinitionMock = sinon.createStubInstance(DeploymentDefinition);

        deploymentDefinitionService = new DeploymentDefinitionService(deploymentDefinitionDAOMock);
    });

    describe("Test scenarios for #getDeploymentsPaged", () => {

        it("should return a page of deployments converted to summary objects", async () => {

            // given
            const page = 3;
            const limit = 12;

            deploymentDefinitionDAOMock.findAll.withArgs({ page, limit})
                .resolves(pagedDeployments);

            // when
            const result = await deploymentDefinitionService.getDeploymentsPaged(page, limit);

            // then
            expect(result).toStrictEqual(pagedDeploymentSummaries)
        });
    });

    describe("Test scenarios for #getDeployment", () => {

        it("should return identified deployment", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeploymentDefinition.id)
                .resolves(dockerAllArgsDeploymentDefinition);

            // when
            const result = await deploymentDefinitionService
                .getDeployment(dockerAllArgsDeploymentDefinition.id);

            // then
            expect(result).toStrictEqual(extendedDockerAllArgsDeployment);
        });

        it("should raise error on unknown deployment", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id).resolves(undefined);

            // when
            const failingCall = async () => await deploymentDefinitionService.getDeployment(dockerAllArgsDeployment.id);

            // then
            await expect(failingCall).rejects.toThrow(UnknownDeploymentError);
        });
    });

    describe("Test scenarios for #saveDefinition", () => {

        it("should save a new definition", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id).resolves(null);

            // when
            const result = await deploymentDefinitionService.saveDefinition(dockerAllArgsDeployment, false);

            // then
            expect(result).toEqual(true);

            sinon.assert.calledWith(deploymentDefinitionDAOMock.save, {
                id: dockerAllArgsDeployment.id,
                definition: dockerAllArgsDeployment,
                locked: false
            });
        });

        it("should save a modified unlocked definition", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeploymentDefinitionUnlocked.id)
                .resolves(dockerAllArgsDeploymentDefinitionUnlocked);

            // when
            const result = await deploymentDefinitionService.saveDefinition(dockerAllArgsDeploymentModified, true);

            // then
            expect(result).toEqual(true);

            sinon.assert.calledWith(deploymentDefinitionDAOMock.save, {
                id: dockerAllArgsDeploymentModified.id,
                definition: dockerAllArgsDeploymentModified,
                locked: true
            });
        });

        it("should ignore saving a definition with unchanged checksum", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeploymentDefinition.id)
                .resolves(dockerAllArgsDeploymentDefinition);

            // when
            const result = await deploymentDefinitionService.saveDefinition(dockerAllArgsDeployment, true);

            // then
            expect(result).toEqual(false);

            sinon.assert.notCalled(deploymentDefinitionDAOMock.save);
        });

        it("should ignore saving a locked definition with changed checksum", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id)
                .resolves(dockerAllArgsDeploymentDefinition);

            // when
            const result = await deploymentDefinitionService.saveDefinition(dockerAllArgsDeploymentModified, true);

            // then
            expect(result).toEqual(false);

            sinon.assert.notCalled(deploymentDefinitionDAOMock.save);
        });
    });

    describe("Test scenarios for #importDefinition", () => {

        it("should unlock existing definition before save then lock it back afterward", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id)
                .onFirstCall().resolves(storedDefinitionMock)
                .onSecondCall().resolves(dockerAllArgsDeploymentDefinitionUnlocked)
                .onThirdCall().resolves(storedDefinitionMock);

            // when
            const result = await deploymentDefinitionService.importDefinition(dockerAllArgsDeploymentModified);

            // then
            expect(result).toEqual(true);

            // @ts-ignore
            sinon.assert.calledWith(storedDefinitionMock.set, "locked", false);
            // @ts-ignore
            sinon.assert.calledWith(storedDefinitionMock.set, "locked", true);
            sinon.assert.calledTwice(storedDefinitionMock.save);
            sinon.assert.calledWith(deploymentDefinitionDAOMock.save, {
                id: dockerAllArgsDeploymentDefinition.id,
                definition: dockerAllArgsDeploymentModified,
                locked: true
            });
        });

        it("should skip changing lock of non-existing definition", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id)
                .onFirstCall().resolves(null)
                .onSecondCall().resolves(dockerAllArgsDeploymentDefinitionUnlocked)
                .onThirdCall().resolves(storedDefinitionMock);

            // when
            const result = await deploymentDefinitionService.importDefinition(dockerAllArgsDeploymentModified);

            // then
            expect(result).toEqual(true);

            // @ts-ignore
            sinon.assert.neverCalledWith(storedDefinitionMock.set, "locked", false);
            // @ts-ignore
            sinon.assert.calledWith(storedDefinitionMock.set, "locked", true);
            sinon.assert.calledOnce(storedDefinitionMock.save);
            sinon.assert.calledWith(deploymentDefinitionDAOMock.save, {
                id: dockerAllArgsDeploymentDefinition.id,
                definition: dockerAllArgsDeploymentModified,
                locked: true
            });
        });
    });
});
