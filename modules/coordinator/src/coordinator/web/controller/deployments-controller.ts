import { DeploymentSummary } from "@coordinator/core/domain";
import {
    deploymentDefinitionService,
    DeploymentDefinitionService
} from "@coordinator/core/service/deployment-definition-service";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { pageConverter } from "@coordinator/web/conversion";
import { PageRequest, PageResponse, ResponseWrapper } from "@coordinator/web/model/common";
import {
    DeploymentCreationRequest,
    DeploymentExport,
    DeploymentImportRequest,
    DeploymentUpdateRequest,
    ExtendedDeployment,
    GetDeploymentRequest
} from "@coordinator/web/model/deployment";
import { Validated } from "@coordinator/web/utility/validator";
import { HttpStatus } from "@core-lib/platform/api/common";
import { Deployment } from "@core-lib/platform/api/deployment";

/**
 * Controller implementation to handle deployment definition operations.
 */
export class DeploymentsController implements Controller {

    private readonly deploymentDefinitionService: DeploymentDefinitionService;

    constructor(deploymentDefinitionService: DeploymentDefinitionService) {
        this.deploymentDefinitionService = deploymentDefinitionService;
    }

    /**
     * GET /deployments[?pageSize={size}&pageNumber={number}]
     * Returns all registered deployment definitions in a paginated manner.
     *
     * @param page wrapper for the optional page parameters, defaults to the first page, containing at most 10 items
     */
    @Validated()
    async listDeployments(page: PageRequest): Promise<ResponseWrapper<PageResponse<DeploymentSummary>>> {

        const deploymentPage = await this.deploymentDefinitionService.getDeploymentsPaged(page.page, page.size);

        return new ResponseWrapper(HttpStatus.OK, pageConverter(deploymentPage));
    }

    /**
     * GET /deployments/{id}
     * Returns the registered deployment definitions identified by the given deployment ID.
     *
     * @param request ID of the deployment to return, along with the optional "yaml" flag to request exporting the deployment in YAML format
     */
    async getDeployment(request: GetDeploymentRequest): Promise<ResponseWrapper<Deployment | DeploymentExport>> {

        const deployment = await this.deploymentDefinitionService.getDeployment(request.id, request.yaml);

        return new ResponseWrapper(HttpStatus.OK, deployment);
    }

    /**
     * POST /deployments
     * Creates a new deployment definition. Request is expected in JSON format.
     *
     * @param deploymentCreationRequest deployment definition content
     */
    @Validated()
    async createDeployment(deploymentCreationRequest: DeploymentCreationRequest): Promise<ResponseWrapper<ExtendedDeployment>> {

        const saved = await this.deploymentDefinitionService.saveDefinition(deploymentCreationRequest.definition, false);
        const deployment = await this.deploymentDefinitionService.getDeployment(deploymentCreationRequest.id, false) as ExtendedDeployment;

        return this.mapSaveResult(saved, deployment);
    }

    /**
     * POST /deployments/import
     * Imports a deployment definition. Request is expected in YAML format.
     *
     * @param deploymentImportRequest deployment definition as YAML (same format as the static deployment definition)
     */
    @Validated()
    async importDeployment(deploymentImportRequest: DeploymentImportRequest): Promise<ResponseWrapper<void>> {

        const imported = await this.deploymentDefinitionService.importDefinition(deploymentImportRequest.definition);

        return this.mapSaveResult(imported);
    }

    /**
     * PUT /deployments/:id
     * Updates an existing deployment definition (if unlocked).
     *
     * @param deploymentUpdateRequest updated deployment definition content
     */
    @Validated()
    async updateDeployment(deploymentUpdateRequest: DeploymentUpdateRequest): Promise<ResponseWrapper<ExtendedDeployment>> {

        await this.assertExistingDeployment(deploymentUpdateRequest.id);
        const deployment: Deployment = {
            id: deploymentUpdateRequest.id,
            ...deploymentUpdateRequest.definition
        }
        const saved = await this.deploymentDefinitionService.saveDefinition(deployment, false);
        const updatedDeployment = await this.deploymentDefinitionService.getDeployment(deployment.id, false) as ExtendedDeployment;

        return this.mapSaveResult(saved, updatedDeployment);
    }

    /**
     * PUT /deployments/:id/unlock
     * Unlocks an existing, imported deployment definition.
     *
     * @param id ID of the deployment to be unlocked
     */
    async unlockDeployment(id: string): Promise<ResponseWrapper<void>> {

        await this.deploymentDefinitionService.unlockDefinition(id);

        return new ResponseWrapper(HttpStatus.OK);
    }

    /**
     * DELETE /deployments/:id
     * Deletes an existing deployment definition.
     *
     * @param id ID of the deployment to be deleted
     */
    async deleteDeployment(id: string): Promise<ResponseWrapper<void>> {

        await this.deploymentDefinitionService.deleteDefinition(id);

        return new ResponseWrapper(HttpStatus.NO_CONTENT);
    }

    controllerType(): ControllerType {
        return ControllerType.DEPLOYMENTS;
    }

    private async assertExistingDeployment(id: string): Promise<void> {
        await this.deploymentDefinitionService.getDeployment(id, false);
    }

    private mapSaveResult<T>(saved: boolean, body?: T): ResponseWrapper<T> {

        return new ResponseWrapper(saved
            ? HttpStatus.CREATED
            : HttpStatus.OK, body);
    }
}

export const deploymentsController = new DeploymentsController(deploymentDefinitionService);
