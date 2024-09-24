import { deploymentConfigModule, DeploymentRegistry } from "@coordinator/core/config/deployment-config-module";
import { Page, PageAttributes } from "@coordinator/core/domain";
import { Deployment } from "@core-lib/platform/api/deployment";

/**
 * DAO implementation for managing deployment definitions.
 * Current implementation accesses definitions via the DeploymentRegistry, backed by the static deployment configuration file.
 */
export class DeploymentDefinitionDAO {

    private readonly deploymentRegistry: DeploymentRegistry;

    constructor(deploymentRegistry: DeploymentRegistry) {
        this.deploymentRegistry = deploymentRegistry;
    }

    /**
     * Returns all registered deployment definitions in a paginated manner.
     *
     * @param page wrapper for the page parameters
     */
    public async findAll(page: PageAttributes): Promise<Page<Deployment>> {

        const allDeployments = this.deploymentRegistry
            .getAllDeployments()
            .sort((left, right) => left.id.localeCompare(right.id));
        const offset = (page.page - 1) * page.limit;
        const deploymentsOnPage = allDeployments.slice(offset, offset + page.limit);
        const totalPages = Math.ceil(allDeployments.length / page.limit);

        return {
            itemCountOnPage: deploymentsOnPage.length,
            pageSize: page.limit,
            pageNumber: page.page,
            totalItemCount: allDeployments.length,
            totalPages,
            items: deploymentsOnPage
        }
    }

    /**
     * Returns the registered deployment definition identified by the given deployment ID.
     *
     * @param id ID of the deployment to return, or undefined if not found
     */
    public async findOne(id: string): Promise<Deployment | undefined> {
        return this.deploymentRegistry.getDeployment(id);
    }
}

export const deploymentDefinitionDAO: DeploymentDefinitionDAO = new DeploymentDefinitionDAO(deploymentConfigModule.getConfiguration());
