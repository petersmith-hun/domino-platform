import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { ControllerType } from "@coordinator/web/controller/controller";
import { DeploymentsController } from "@coordinator/web/controller/deployments-controller";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { HttpStatus } from "@core-lib/platform/api/common";
import { extendedDeployment, pagedDeploymentSummaries } from "@testdata/core";
import { dockerAllArgsDeployment, extendedDockerAllArgsDeployment } from "@testdata/deployment";
import {
    deploymentCreationRequest,
    deploymentExport,
    deploymentImportRequest, deploymentUpdateRequest,
    getDeploymentAsYamlRequest,
    getDeploymentRequest,
    invalidPageRequest,
    pageRequest,
    pageRequestWithDefaults,
    pageResponse
} from "@testdata/web";
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
            deploymentDefinitionServiceMock.getDeployment.withArgs(dockerAllArgsDeployment.id, false)
                .resolves(extendedDockerAllArgsDeployment);

            // when
            const result = await deploymentsController.getDeployment(getDeploymentRequest);

            // then
            expect(result.content).toStrictEqual(extendedDockerAllArgsDeployment);
            expect(result.status).toStrictEqual(HttpStatus.OK);
        });

        it("should return identified deployment as YAML", async () => {

            // given
            deploymentDefinitionServiceMock.getDeployment.withArgs(dockerAllArgsDeployment.id, true)
                .resolves(deploymentExport);

            // when
            const result = await deploymentsController.getDeployment(getDeploymentAsYamlRequest);

            // then
            expect(result.content).toStrictEqual(deploymentExport);
            expect(result.status).toStrictEqual(HttpStatus.OK);
        });
    });

    describe("Test scenarios for #createDeployment", () => {

        it("should create deployment return CREATED status", async () => {

            // given
            deploymentDefinitionServiceMock.saveDefinition.withArgs(deploymentCreationRequest.definition, false)
                .resolves(true);
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentCreationRequest.id, false)
                .resolves(extendedDeployment);

            // when
            const result = await deploymentsController.createDeployment(deploymentCreationRequest);

            // then
            expect(result.status).toStrictEqual(HttpStatus.CREATED);
            expect(result.content).toStrictEqual(extendedDeployment);
        });

        it("should create deployment return OK status", async () => {

            // given
            deploymentDefinitionServiceMock.saveDefinition.withArgs(deploymentCreationRequest.definition, false)
                .resolves(false);
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentCreationRequest.id, false)
                .resolves(extendedDeployment);

            // when
            const result = await deploymentsController.createDeployment(deploymentCreationRequest);

            // then
            expect(result.status).toStrictEqual(HttpStatus.OK);
            expect(result.content).toStrictEqual(extendedDeployment);
        });
    })

    describe("Test scenarios for #importDeployment", () => {

        it("should import deployment return CREATED status", async () => {

            // given
            deploymentDefinitionServiceMock.importDefinition.withArgs(deploymentImportRequest.definition)
                .resolves(true);

            // when
            const result = await deploymentsController.importDeployment(deploymentImportRequest);

            // then
            expect(result.status).toStrictEqual(HttpStatus.CREATED);
        });
    })

    describe("Test scenarios for #updateDeployment", () => {

        it("should update deployment return CREATED status", async () => {

            // given
            deploymentDefinitionServiceMock.saveDefinition.withArgs(deploymentUpdateRequest.definition)
                .resolves(true);
            deploymentDefinitionServiceMock.getDeployment.withArgs(deploymentUpdateRequest.id, false)
                .resolves(extendedDeployment);

            // when
            const result = await deploymentsController.updateDeployment(deploymentUpdateRequest);

            // then
            expect(result.status).toStrictEqual(HttpStatus.CREATED);
        });
    })

    describe("Test scenarios for #unlockDeployment", () => {

        it("should unlock deployment", async () => {

            // when
            const result = await deploymentsController.unlockDeployment(extendedDeployment.id);

            // then
            expect(result.status).toStrictEqual(HttpStatus.OK);

            sinon.assert.calledWith(deploymentDefinitionServiceMock.unlockDefinition, extendedDeployment.id);
        });
    })

    describe("Test scenarios for #deleteDeployment", () => {

        it("should unlock deployment", async () => {

            // when
            const result = await deploymentsController.deleteDeployment(extendedDeployment.id);

            // then
            expect(result.status).toStrictEqual(HttpStatus.NO_CONTENT);

            sinon.assert.calledWith(deploymentDefinitionServiceMock.deleteDefinition, extendedDeployment.id);
        });
    })

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.DEPLOYMENTS", () => {

            // when
            const result = deploymentsController.controllerType();

            // then
            expect(result).toBe(ControllerType.DEPLOYMENTS);
        });
    });
});
