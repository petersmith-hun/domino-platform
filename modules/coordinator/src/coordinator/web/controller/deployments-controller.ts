import { DeploymentSummary } from "@coordinator/core/domain";
import {
    deploymentDefinitionService,
    DeploymentDefinitionService
} from "@coordinator/core/service/deployment-definition-service";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { pageConverter } from "@coordinator/web/conversion";
import { PageRequest, PageResponse, ResponseWrapper } from "@coordinator/web/model/common";
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
     * @param id ID of the deployment to return
     */
    async getDeployment(id: string): Promise<ResponseWrapper<Deployment>> {

        const deployment = await this.deploymentDefinitionService.getDeployment(id);

        return new ResponseWrapper(HttpStatus.OK, deployment);
    }

    controllerType(): ControllerType {
        return ControllerType.DEPLOYMENTS;
    }
}

export const deploymentsController = new DeploymentsController(deploymentDefinitionService);
