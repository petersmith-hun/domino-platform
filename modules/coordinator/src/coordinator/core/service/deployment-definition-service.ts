import { ImportedDeploymentConfigModule } from "@coordinator/core/config/imported-deployment-config-module";
import {
    deploymentDefinitionPageConverter,
    extendedDeploymentConverter,
    yamlExporter
} from "@coordinator/core/conversion";
import { deploymentDefinitionDAO, DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { DefinitionSaveResult, DeploymentSummary, Page } from "@coordinator/core/domain";
import { checksum, DeploymentDefinition } from "@coordinator/core/domain/storage";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { DeploymentExport, ExtendedDeployment } from "@coordinator/web/model/deployment";
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
        }).then(deploymentDefinitionPageConverter);
    }

    /**
     * Returns the registered deployment definition identified by the given deployment ID.
     *
     * @param id ID of the deployment to return
     * @param yaml returns the deployment definition in YAML format if set to true
     * @throws UnknownDeploymentError if the requested definition does not exist
     */
    public async getDeployment(id: string, yaml: boolean): Promise<ExtendedDeployment | DeploymentExport> {

        const deploymentDefinition = await this.deploymentDefinitionDAO.findOne(id);
        if (!deploymentDefinition) {
            throw new UnknownDeploymentError(id);
        }

        return yaml
            ? yamlExporter(deploymentDefinition.definition)
            : extendedDeploymentConverter(deploymentDefinition);
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
    public async saveDefinition(deployment: Deployment, lockDefinition: boolean): Promise<DefinitionSaveResult> {

        const storedDefinition = await this.deploymentDefinitionDAO.findOne(deployment.id);
        if (!(await this.shouldSave(storedDefinition, deployment))) {
            this.logger.debug(`Definition ${deployment.id} already exists, skipping`);
            return DefinitionSaveResult.IGNORED;
        }

        if (storedDefinition?.locked) {
            this.logger.warn(`Definition ${deployment.id} is locked, skipping`);
            return DefinitionSaveResult.LOCKED;
        }

        await this.deploymentDefinitionDAO.save({
            id: deployment.id,
            definition: deployment,
            locked: lockDefinition
        });

        this.logger.info(`Saved definition ${deployment.id}`);

        return DefinitionSaveResult.SAVED;
    }

    /**
     * Saves the given definition, ignoring the lock status by forcibly unlocking the definition before saving it,
     * then locking it again. Checksum check may still reject saving the definition. If the provided deployment
     * definition is a string (importing via API from static definition), it is parsed into internal representation
     * first.
     *
     * @see saveDefinition for further information on the saving mechanism
     * @param deploymentContent deployment definition to be saved
     */
    public async importDefinition(deploymentContent: Deployment | string): Promise<boolean> {

        const deployment = typeof deploymentContent === "string"
            ? this.parseDefinition(deploymentContent)
            : deploymentContent;

        await this.setLock(deployment.id, false);
        const saveResult = await this.saveDefinition(deployment, true);
        await this.setLock(deployment.id, true);

        return saveResult === DefinitionSaveResult.SAVED;
    }

    /**
     * Unlocks the given deployment definition.
     *
     * @param id ID of the deployment definition to be unlocked
     * @throws UnknownDeploymentError if the requested deployment definition does not exist
     */
    public async unlockDefinition(id: string): Promise<void> {

        const updated = await this.setLock(id, false);
        if (!updated) {
            throw new UnknownDeploymentError(id);
        }
    }

    /**
     * Deletes the given deployment definition.
     *
     * @param id ID of the deployment definition to be deleted
     */
    public async deleteDefinition(id: string): Promise<void> {

        await this.deploymentDefinitionDAO.delete(id);
        this.logger.info(`Deleted definition ${id}`);
    }

    private parseDefinition(deploymentDefinition: string): Deployment {

        return new ImportedDeploymentConfigModule(deploymentDefinition, this.logger)
            .getConfiguration();
    }

    private async setLock(id: string, locked: boolean): Promise<boolean> {

        const updated = await this.deploymentDefinitionDAO.updateLock(id, locked);

        if (updated) {
            this.logger.info(`${locked ? "Locked" : "Unlocked"} definition ${id}`);
        } else {
            this.logger.debug(`Cannot set lock of missing definition ${id}`);
        }

        return updated;
    }

    private async shouldSave(existingDefinition: DeploymentDefinition | null, deployment: Deployment): Promise<boolean> {
        return existingDefinition?.checksum !== checksum(JSON.stringify(deployment));
    }
}

export const deploymentDefinitionService = new DeploymentDefinitionService(deploymentDefinitionDAO);
