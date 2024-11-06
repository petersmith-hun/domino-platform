import { AbstractDeploymentConfigModule } from "@coordinator/core/config/abstract-deployment-config-module";
import { InvalidImportedDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment, validIDMatcher } from "@core-lib/platform/api/deployment";
import { MapNode } from "@core-lib/platform/config";
import * as yaml from "js-yaml";
import { ILogObj, Logger } from "tslog";

// stops recursive enhancement of parsed YAML object after number of steps defined below
const maxDepth = 4;

/**
 * AbstractConfigurationModule implementation for initializing a deployment configurations from imported deployment
 * configurations (via API).
 */
export class ImportedDeploymentConfigModule extends AbstractDeploymentConfigModule<Deployment> {

    constructor(yamlContent: string, logger: Logger<ILogObj>) {
        super(yamlContent, mapNode => this.parseConfig(mapNode), logger, false, false);
        super.init(false, (content) => this.loadConfigFromText(content));
    }

    private parseConfig(mapNode: MapNode): Deployment {

        const id = mapNode?.keys().next()?.value;
        if (!(id && validIDMatcher.test(id))) {
            throw new InvalidImportedDeploymentError(`Imported definition ID=${id} is invalid`);
        }

        try {
            const definition = mapNode!.get(id) as any;
            extendObjectRecursively(definition);

            return this.mapDeployment(id, definition as MapNode);

        } catch (error: any) {
            throw new InvalidImportedDeploymentError(`Failed to parse definition by ID=${id}: ${error?.message}`);
        }
    }

    private loadConfigFromText(content: string): Map<string, object> {

        try {
            const loadedDefinition = yaml.load(content) as any;
            const id = Object.keys(loadedDefinition.domino.deployments).pop()!;
            const definition = loadedDefinition.domino.deployments[id];

            return new Map<string, object>([
                [id, definition]
            ]);

        } catch (error: any) {
            throw new InvalidImportedDeploymentError(`Failed to load YAML formatted definition: ${error?.message}`);
        }
    }
}

const extendObjectRecursively = (target: any, currentDepth: number = 0): void => {

    if (currentDepth >= maxDepth) {
        throw new InvalidImportedDeploymentError("Reached max depth of recursive enhancement, considering definition to be invalid");
    }

    if (typeof target !== "object") {
        return;
    }

    Object.keys(target)
        .filter(key => typeof target[key] === "object")
        .forEach(key => extendObjectRecursively(target[key], currentDepth + 1));

    extendObject(target);
}

const extendObject = (target: any): void => {

    target.has = (key: string): boolean => {
        return key in target;
    }

    target.get = (key: string): any => {
        return target[key];
    }
}
