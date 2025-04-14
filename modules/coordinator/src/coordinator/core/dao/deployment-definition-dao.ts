import { Page, PageAttributes } from "@coordinator/core/domain";
import { DeploymentDefinition, DeploymentDefinitionCreationAttributes } from "@coordinator/core/domain/storage";

/**
 * DAO implementation for managing deployment definitions.
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
            order: [
                ["id", "ASC"]
            ]
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
        await DeploymentDefinition.upsert(deploymentDefinition);
    }

    /**
     * Updates the lock status of an existing definition. Returns a boolean flag indicating whether updating the lock
     * was successful (the requested deployment definition exists) or not.
     *
     * @param id ID of the deployment to update status of
     * @param locked new lock status
     */
    public async updateLock(id: string, locked: boolean): Promise<boolean> {

        const storedDefinition = await this.findOne(id);
        if (!storedDefinition) {
            return false;
        }

        storedDefinition.set("locked", locked);
        await storedDefinition.save();

        return true;
    }

    /**
     * Deletes an existing deployment definition.
     *
     * @param id ID of the deployment to delete
     */
    public async delete(id: string): Promise<void> {

        const storedDefinition = await this.findOne(id);
        if (!storedDefinition) {
            return;
        }

        await storedDefinition.destroy();
    }
}

export const deploymentDefinitionDAO: DeploymentDefinitionDAO = new DeploymentDefinitionDAO();
