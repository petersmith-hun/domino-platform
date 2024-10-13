import { deploymentSummaryConverter } from "@coordinator/core/conversion";
import { deploymentDefinitionDAO, DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { DeploymentSummary, Page } from "@coordinator/core/domain";
import { checksum, DeploymentDefinition } from "@coordinator/core/domain/storage";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { ExtendedDeployment } from "@coordinator/web/model/deployment";
import { Deployment } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Service implementation controlling deployment definition related operations.
 */
export class DeploymentDefinitionService {

    private readonly logger = LoggerFactory.getLogger(DeploymentDefinitionService);

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
    public async getDeployment(id: string): Promise<ExtendedDeployment> {

        const deploymentDefinition = await this.deploymentDefinitionDAO.findOne(id);
        if (!deploymentDefinition) {
            throw new UnknownDeploymentError(id);
        }

        return {
            ...deploymentDefinition.definition,
            metadata: {
                locked: deploymentDefinition.locked,
                createdAt: deploymentDefinition.createdAt,
                updatedAt: deploymentDefinition.updatedAt
            }
        };
    }

    /**
     * Saves the given definition. Saving the definition is rejected if the definition already exists and:
     *  - the checksum of the new definition matches with the stored one's;
     *  - or the definition is locked for modification (imported from static configuration).
     * The lock can be ignored by calling importDefinition instead.
     *
     * @param deployment deployment definition to be saved
     * @param lockDefinition if set to true, definition is locked for further modifications
     */
    public async saveDefinition(deployment: Deployment, lockDefinition: boolean): Promise<boolean> {

        const storedDefinition = await this.deploymentDefinitionDAO.findOne(deployment.id);
        if (!(await this.shouldSave(storedDefinition, deployment))) {
            this.logger.debug(`Definition ${deployment.id} already exists, skipping`);
            return false;
        }

        if (storedDefinition?.locked) {
            this.logger.debug(`Definition ${deployment.id} is locked, skipping`);
            return false;
        }

        await this.deploymentDefinitionDAO.save({
            id: deployment.id,
            definition: deployment,
            locked: lockDefinition
        });

        this.logger.info(`Saved definition ${deployment.id}`);

        return true;
    }

    /**
     * Saves the given definition, ignoring the lock status by forcibly unlocking the definition before saving it,
     * then locking it again. Checksum check may still reject saving the definition.
     *
     * @see saveDefinition for further information on the saving mechanism
     * @param deployment deployment definition to be saved
     */
    public async importDefinition(deployment: Deployment): Promise<boolean> {

        await this.setLock(deployment.id, false);
        const saved = await this.saveDefinition(deployment, true);
        await this.setLock(deployment.id, true);

        return saved;
    }

    private async setLock(id: string, locked: boolean): Promise<void> {

        const storedDefinition = await this.deploymentDefinitionDAO.findOne(id);
        if (storedDefinition){
            storedDefinition.set("locked", locked);
            await storedDefinition.save();
            this.logger.info(`${locked ? "Locked" : "Unlocked"} definition ${id}`);

        } else {
            this.logger.debug(`Cannot set lock of missing definition ${id}`);
        }
    }

    private async shouldSave(existingDefinition: DeploymentDefinition | null, deployment: Deployment): Promise<boolean> {
        return existingDefinition?.checksum !== checksum(JSON.stringify(deployment));
    }
}

export const deploymentDefinitionService = new DeploymentDefinitionService(deploymentDefinitionDAO);
