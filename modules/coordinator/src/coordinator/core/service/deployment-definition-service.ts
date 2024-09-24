import { deploymentSummaryConverter } from "@coordinator/core/conversion";
import { deploymentDefinitionDAO, DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { DeploymentSummary, Page } from "@coordinator/core/domain";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment } from "@core-lib/platform/api/deployment";

/**
 * Service implementation controlling deployment definition related operations.
 */
export class DeploymentDefinitionService {

    private readonly deploymentDefinitionDAO: DeploymentDefinitionDAO;

    constructor(deploymentDefinitionDAO: DeploymentDefinitionDAO) {
        this.deploymentDefinitionDAO = deploymentDefinitionDAO;
    }

    /**
     * Returns all registered deployment definitions in a paginated manner.
     *
     * @param pageNumber number of the page to return (using 1-based index)
     * @param pageSize maximum item count on a page
     */
    public async getDeploymentsPaged(pageNumber: number, pageSize: number): Promise<Page<DeploymentSummary>> {

        return this.deploymentDefinitionDAO.findAll({
            page: pageNumber,
            limit: pageSize
        }).then(page => {
            return {
                ...page,
                items: page.items.map(deploymentSummaryConverter)
            }
        });
    }

    /**
     * Returns the registered deployment definition identified by the given deployment ID.
     *
     * @param id ID of the deployment to return
     * @throws UnknownDeploymentError if the requested definition does not exist
     */
    public async getDeployment(id: string): Promise<Deployment> {

        const definition = await this.deploymentDefinitionDAO.findOne(id);
        if (!definition) {
            throw new UnknownDeploymentError(id);
        }

        return definition;
    }
}

export const deploymentDefinitionService = new DeploymentDefinitionService(deploymentDefinitionDAO);
