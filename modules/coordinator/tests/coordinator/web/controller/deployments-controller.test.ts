import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { ControllerType } from "@coordinator/web/controller/controller";
import { DeploymentsController } from "@coordinator/web/controller/deployments-controller";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { HttpStatus } from "@core-lib/platform/api/common";
import { pagedDeploymentSummaries } from "@testdata/core";
import { dockerAllArgsDeployment, extendedDockerAllArgsDeployment } from "@testdata/deployment";
import { invalidPageRequest, pageRequest, pageRequestWithDefaults, pageResponse } from "@testdata/web";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentsController", () => {

    let deploymentDefinitionServiceMock: SinonStubbedInstance<DeploymentDefinitionService>;
    let deploymentsController: DeploymentsController;

    beforeEach(() => {
        deploymentDefinitionServiceMock = sinon.createStubInstance(DeploymentDefinitionService);
        deploymentsController = new DeploymentsController(deploymentDefinitionServiceMock);
    });

    describe("Test scenarios for #listDeployments", () => {

        it("should list existing deployments with given paging", async () => {

            // given
            deploymentDefinitionServiceMock.getDeploymentsPaged.withArgs(pageRequest.page, pageRequest.size)
                .resolves(pagedDeploymentSummaries);

            // when
            const result = await deploymentsController.listDeployments(pageRequest);

            // then
            expect(result.content).toStrictEqual(pageResponse);
            expect(result.status).toStrictEqual(HttpStatus.OK);
        });

        it("should list existing deployments with default paging", async () => {

            // given
            deploymentDefinitionServiceMock.getDeploymentsPaged.withArgs(1, 10)
                .resolves(pagedDeploymentSummaries);

            // when
            const result = await deploymentsController.listDeployments(pageRequestWithDefaults);

            // then
            expect(result.content).toStrictEqual(pageResponse);
            expect(result.status).toStrictEqual(HttpStatus.OK);
        });

        it("should fail with validation error", async () => {

            // when
            const failingCall = async () => await deploymentsController.listDeployments(invalidPageRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #getDeployment", () => {

        it("should return identified deployment", async () => {

            // given
            deploymentDefinitionServiceMock.getDeployment.withArgs(dockerAllArgsDeployment.id)
                .resolves(extendedDockerAllArgsDeployment);

            // when
            const result = await deploymentsController.getDeployment(dockerAllArgsDeployment.id);

            // then
            expect(result.content).toStrictEqual(extendedDockerAllArgsDeployment);
            expect(result.status).toStrictEqual(HttpStatus.OK);
        });
    });

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.DEPLOYMENTS", () => {

            // when
            const result = deploymentsController.controllerType();

            // then
            expect(result).toBe(ControllerType.DEPLOYMENTS);
        });
    });
});
