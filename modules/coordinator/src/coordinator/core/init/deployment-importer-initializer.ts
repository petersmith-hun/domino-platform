import { DatasourceConfig, datasourceConfigModule } from "@coordinator/core/config/datasource-config-module";
import { DeploymentConfigModule, deploymentConfigModule } from "@coordinator/core/config/deployment-config-module";
import { Initializer } from "@coordinator/core/init/index";
import {
    deploymentDefinitionService,
    DeploymentDefinitionService
} from "@coordinator/core/service/deployment-definition-service";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Initializer implementation to auto-import static deployment definitions of start-up.
 * Can be disabled by setting the domino.datasource.enable-auto-import flag to false.
 */
export class DeploymentImporterInitializer implements Initializer {

    private readonly logger = LoggerFactory.getLogger(DeploymentImporterInitializer);

    private readonly deploymentConfigModule: DeploymentConfigModule;
    private readonly datasourceConfig: DatasourceConfig;
    private readonly deploymentDefinitionService: DeploymentDefinitionService;

    constructor(deploymentConfigModule: DeploymentConfigModule, datasourceConfig: DatasourceConfig,
                deploymentDefinitionService: DeploymentDefinitionService) {
        this.deploymentConfigModule = deploymentConfigModule;
        this.datasourceConfig = datasourceConfig;
        this.deploymentDefinitionService = deploymentDefinitionService;
    }

    async init(): Promise<void> {

        if (!this.datasourceConfig.enableAutoImport) {
            this.logger.debug("Auto-import disabled, skipping");
            return;
        }

        for (const deployment of this.deploymentConfigModule.getConfiguration().getAllDeployments()) {
            const saved = await this.deploymentDefinitionService.importDefinition(deployment);
            this.logger.info(`Definition ${deployment.id} ${saved ? "successfully imported" : "is already imported, skipping"}`);
        }
    }
}

export const deploymentImporterInitializer = new DeploymentImporterInitializer(deploymentConfigModule,
    datasourceConfigModule.getConfiguration(), deploymentDefinitionService);
