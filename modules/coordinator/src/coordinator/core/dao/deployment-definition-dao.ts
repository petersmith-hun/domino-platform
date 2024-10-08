import { Page, PageAttributes } from "@coordinator/core/domain";
import { DeploymentDefinition, DeploymentDefinitionCreationAttributes } from "@coordinator/core/domain/storage";

/**
 * DAO implementation for managing deployment definitions.
 * Current implementation accesses definitions via the DeploymentRegistry, backed by the static deployment configuration file.
 */
export class DeploymentDefinitionDAO {

    /**
     * Returns all registered deployment definitions in a paginated manner.
     *
     * @param page wrapper for the page parameters
     */
    public async findAll(page: PageAttributes): Promise<Page<DeploymentDefinition>> {

        const offset = (page.page - 1) * page.limit;
        const items: DeploymentDefinition[] = await DeploymentDefinition.findAll({
            offset: offset,
            limit: page.limit,
        });
        const totalItemCount = await DeploymentDefinition.count();
        const totalPages = Math.ceil(totalItemCount / page.limit);

        return {
            itemCountOnPage: items.length,
            pageSize: page.limit,
            pageNumber: page.page,
            totalItemCount,
            totalPages,
            items
        }
    }

    /**
     * Returns the registered deployment definition identified by the given deployment ID.
     *
     * @param id ID of the deployment to return, or undefined if not found
     */
    public async findOne(id: string): Promise<DeploymentDefinition | null> {
        return DeploymentDefinition.findByPk(id);
    }

    /**
     * Saves (creates new or updates existing) deployment definition.
     *
     * @param deploymentDefinition deployment definition and its metadata to be saved
     */
    public async save(deploymentDefinition: DeploymentDefinitionCreationAttributes): Promise<void> {
        await DeploymentDefinition.create(deploymentDefinition);
    }
}

export const deploymentDefinitionDAO: DeploymentDefinitionDAO = new DeploymentDefinitionDAO();
