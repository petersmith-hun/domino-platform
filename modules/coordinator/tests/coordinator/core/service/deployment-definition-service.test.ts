import { DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { pagedDeployments, pagedDeploymentSummaries } from "@testdata/core";
import { dockerAllArgsDeployment } from "@testdata/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentDefinitionService", () => {

    let deploymentDefinitionDAOMock: SinonStubbedInstance<DeploymentDefinitionDAO>;
    let deploymentDefinitionService: DeploymentDefinitionService;

    beforeEach(() => {
        deploymentDefinitionDAOMock = sinon.createStubInstance(DeploymentDefinitionDAO);

        deploymentDefinitionService = new DeploymentDefinitionService(deploymentDefinitionDAOMock);
    });

    describe("Test scenarios for #getDeploymentsPaged", () => {

        it("should return a page of deployments converted to summary objects", async () => {

            // given
            const page = 3;
            const limit = 12;

            deploymentDefinitionDAOMock.findAll.withArgs({ page, limit}).resolves(pagedDeployments);

            // when
            const result = await deploymentDefinitionService.getDeploymentsPaged(page, limit);

            // then
            expect(result).toStrictEqual(pagedDeploymentSummaries)
        });
    });

    describe("Test scenarios for #getDeployment", () => {

        it("should return identified deployment", async () => {

            // given
            deploymentDefinitionDAOMock.findOne.withArgs(dockerAllArgsDeployment.id).resolves(dockerAllArgsDeployment);

            // when
            const result = await deploymentDefinitionService.getDeployment(dockerAllArgsDeployment.id);

            // then
            expect(result).toStrictEqual(dockerAllArgsDeployment);
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
});
