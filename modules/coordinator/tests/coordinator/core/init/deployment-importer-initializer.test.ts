import { DatasourceConfig } from "@coordinator/core/config/datasource-config-module";
import { DeploymentConfigModule, DeploymentRegistry } from "@coordinator/core/config/deployment/deployment-config-module";
import { DeploymentImporterInitializer } from "@coordinator/core/init/deployment-importer-initializer";
import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { dockerAllArgsDeployment, dockerNoArgsDeployment } from "@testdata/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentImporterInitializer", () => {

    let deploymentConfigModuleMock: SinonStubbedInstance<DeploymentConfigModule>;
    let deploymentRegistryMock: SinonStubbedInstance<DeploymentRegistry>;
    let deploymentDefinitionServiceMock: SinonStubbedInstance<DeploymentDefinitionService>;
    let deploymentImporterInitializer: DeploymentImporterInitializer;

    beforeEach(() => {
        deploymentConfigModuleMock = sinon.createStubInstance(DeploymentConfigModule);
        deploymentRegistryMock = sinon.createStubInstance(DeploymentRegistry);
        deploymentDefinitionServiceMock = sinon.createStubInstance(DeploymentDefinitionService);

        deploymentConfigModuleMock.getConfiguration.returns(deploymentRegistryMock);
        deploymentRegistryMock.getAllDeployments.returns([
            dockerAllArgsDeployment,
            dockerNoArgsDeployment
        ]);
    });

    describe("Test scenarios for #init", () => {

        it("should import definitions when auto-import is enabled", async () => {

            // given
            prepareImporter(true);
            deploymentDefinitionServiceMock.importDefinition.withArgs(dockerAllArgsDeployment).resolves(true);
            deploymentDefinitionServiceMock.importDefinition.withArgs(dockerNoArgsDeployment).resolves(false);

            // when
            await deploymentImporterInitializer.init();

            // then
            sinon.assert.calledWith(deploymentDefinitionServiceMock.importDefinition, dockerAllArgsDeployment);
            sinon.assert.calledWith(deploymentDefinitionServiceMock.importDefinition, dockerNoArgsDeployment);
        });

        it("should skip import when auto-import is disabled", async () => {

            // given
            prepareImporter(false);

            // when
            await deploymentImporterInitializer.init();

            // then
            sinon.assert.notCalled(deploymentDefinitionServiceMock.importDefinition);
        });

        function prepareImporter(enableAutoImport: boolean): void {

            const datasourceConfig: DatasourceConfig = {
                enableAutoImport,
                sqliteDatafilePath: ""
            };

            deploymentImporterInitializer = new DeploymentImporterInitializer(deploymentConfigModuleMock,
                datasourceConfig, deploymentDefinitionServiceMock);
        }
    });
});
