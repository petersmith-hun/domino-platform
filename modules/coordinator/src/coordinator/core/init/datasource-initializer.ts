import { DatasourceConfig, datasourceConfigModule } from "@coordinator/core/config/datasource-config-module";
import {
    DeploymentDefinition,
    deploymentDefinitionAttributes,
    Secret,
    secretAttributes
} from "@coordinator/core/domain/storage";
import { Initializer } from "@coordinator/core/init";
import LoggerFactory from "@core-lib/platform/logging";
import { Sequelize } from "sequelize";

/**
 * Initializer implementation to (if needed create) and connect to the SQLite datasource.
 */
export class DatasourceInitializer implements Initializer {

    private readonly logger = LoggerFactory.getLogger(DatasourceInitializer);

    private readonly datasourceConfig: DatasourceConfig;

    constructor(datasourceConfig: DatasourceConfig) {
        this.datasourceConfig = datasourceConfig;
    }

    async init(): Promise<void> {

        this.logger.info(`Attaching SQLite datasource at '${this.datasourceConfig.sqliteDatafilePath}'...`);

        const sequelize = this.configureSequelizeInstance();
        this.initModels(sequelize);
        await sequelize.sync();

        this.logger.info(`SQLite datasource has been attached successfully`);
        await this.logDefinitionCount();

        return;
    }

    private configureSequelizeInstance(): Sequelize {

        return new Sequelize("database", "", "", {
            dialect: "sqlite",
            storage: this.datasourceConfig.sqliteDatafilePath,
            logging: false,
            sync: {
                logging: (sql) => this.logger.debug(sql)
            }
        });
    }

    private initModels(sequelize: Sequelize): void {

        DeploymentDefinition.init(deploymentDefinitionAttributes, {
            sequelize: sequelize,
            tableName: "deployment_definitions",
            createdAt: "created_at",
            updatedAt: "updated_at"
        });

        Secret.init(secretAttributes, {
            sequelize: sequelize,
            tableName: "secrets",
            createdAt: "created_at",
            updatedAt: "updated_at"
        })
    }

    private async logDefinitionCount(): Promise<void> {
        this.logger.info(`Loaded ${await DeploymentDefinition.count()} deployment definition(s)`);
    }
}

export const datasourceInitializer = new DatasourceInitializer(datasourceConfigModule.getConfiguration());
