import { AbstractDeploymentConfigModule } from "@coordinator/core/config/deployment/abstract-deployment-config-module";
import { loadConfigFromJSON, loadConfigFromText, RawDeployment } from "@coordinator/core/config/deployment/loader";
import { InvalidImportedDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment, validIDMatcher } from "@core-lib/platform/api/deployment";
import { MapNode } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";

// stops recursive enhancement of parsed YAML object after number of steps defined below
const maxDepth = 4;

/**
 * AbstractConfigurationModule implementation for initializing a deployment configurations from imported deployment
 * configurations (via API).
 */
export class ImportedDeploymentConfigModule extends AbstractDeploymentConfigModule<Deployment> {

    private static readonly logger = LoggerFactory.getLogger(ImportedDeploymentConfigModule);

    private constructor(loaderSupplier: () => Map<string, object>) {
        super(null, mapNode => this.parseConfig(mapNode), ImportedDeploymentConfigModule.logger, false);
        super.init(false, loaderSupplier);
    }

    /**
     * Loads a deployment definition from YAML (static deployment definition) source.
     *
     * @param deploymentContent YAML source string
     */
    public static fromYAML(deploymentContent: string): Deployment {
        return new ImportedDeploymentConfigModule(() => loadConfigFromText(deploymentContent)).getConfiguration();
    }

    /**
     * Loads a deployment definition from raw JSON source (dynamic API).
     *
     * @param deploymentContent JSON source document
     */
    public static fromJSON(deploymentContent: RawDeployment): Deployment {
        return new ImportedDeploymentConfigModule(() => loadConfigFromJSON(deploymentContent)).getConfiguration();
    }

    private parseConfig(mapNode: MapNode): Deployment {

        const id = mapNode?.keys().next()?.value;
        if (!(id && validIDMatcher.test(id))) {
            throw new InvalidImportedDeploymentError(`Imported definition ID=${id} is invalid`);
        }

        try {
            const definition = mapNode!.get(id) as any;
            this.extendObjectRecursively(definition);

            return this.mapDeployment(id, definition as MapNode);

        } catch (error: any) {
            throw new InvalidImportedDeploymentError(`Failed to parse definition by ID=${id}: ${error?.message}`);
        }
    }

    private extendObjectRecursively(target: any, currentDepth: number = 0): void {

        if (currentDepth >= maxDepth) {
            throw new InvalidImportedDeploymentError("Reached max depth of recursive enhancement, considering definition to be invalid");
        }

        if (typeof target !== "object") {
            return;
        }

        Object.keys(target)
            .filter(key => typeof target[key] === "object")
            .forEach(key => this.extendObjectRecursively(target[key], currentDepth + 1));

        this.extendObject(target);
    }

    private extendObject(target: any): void {

        target.has = (key: string): boolean => {
            return key in target;
        }

        target.get = (key: string): any => {
            return target[key];
        }
    }
}
