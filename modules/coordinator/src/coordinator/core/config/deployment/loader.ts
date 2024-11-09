import { InvalidImportedDeploymentError } from "@coordinator/core/error/error-types";
import * as yaml from "js-yaml";

export type RawDeployment = { id: string };
type DefinitionRoot = { domino: { deployments: { [id: string]: any } } };
type DataFix = {
    source: (definition: any) => any,
    target: (definition: any, extractedValue: any) => void
}

/**
 * Loads a deployment definition from JSON source (dynamic API).
 *
 * @param content unidentified deployment definition source (must be an object containing the definition, ID is always expected)
 */
export const loadConfigFromJSON = (content: RawDeployment): Map<string, object> => {

    const updatedContent: any = content;
    jsonDataFixes.forEach(dataFix => {
        const extractedValue = dataFix.source(updatedContent);
        if (extractedValue) {
            dataFix.target(updatedContent, extractedValue);
        }
    });

    return loadConfigContent(() => {
        return {
            domino: {
                deployments: {
                    [content.id]: updatedContent
                }
            }
        } as DefinitionRoot
    });
}

/**
 * Loads a deployment definition from YAML source (import API).
 *
 * @param content unidentified deployment definition source (must match the static deployment configuration file base
 * structure for a single deployment definition)
 */
export const loadConfigFromText = (content: string): Map<string, object> => {
    return loadConfigContent(() => yaml.load(content) as DefinitionRoot);
}

const loadConfigContent = (loader: () => DefinitionRoot): Map<string, object> => {

    try {
        const loadedDefinition = loader();
        const id = Object.keys(loadedDefinition.domino.deployments).pop()!;
        const definition = loadedDefinition.domino.deployments[id];

        return new Map<string, object>([
            [id, definition]
        ]);

    } catch (error: any) {
        throw new InvalidImportedDeploymentError(`Failed to load YAML/JSON formatted definition: ${error?.message}`);
    }
}

const jsonDataFixes: DataFix[] = [
    {
        source: (definition: any) => definition.execution?.asUser,
        target: (definition: any, extractedValue: any) => definition.execution["as-user"] = extractedValue
    },
    {
        source: (definition: any) => definition.execution?.args?.networkMode,
        target: (definition: any, extractedValue: any) => definition.execution.args["network-mode"] = extractedValue
    },
    {
        source: (definition: any) => definition.execution?.args?.restartPolicy,
        target: (definition: any, extractedValue: any) => definition.execution.args["restart-policy"] = extractedValue
    },
    {
        source: (definition: any) => definition.execution?.args?.commandArgs,
        target: (definition: any, extractedValue: any) => definition.execution.args["command-args"] = extractedValue
    },
    {
        source: (definition: any) => definition.healthcheck?.maxAttempts,
        target: (definition: any, extractedValue: any) => definition.healthcheck["max-attempts"] = extractedValue
    },
    {
        source: (definition: any) => definition.info?.fieldMapping,
        target: (definition: any, extractedValue: any) => definition.info["field-mapping"] = extractedValue
    },
    {
        source: (definition: any) => definition.execution.commandName,
        target: (definition: any, extractedValue: any) => definition.execution["command-name"] = extractedValue
    },
    {
        source: (definition: any) => definition.healthcheck,
        target: (definition: any, extractedValue: any) => definition["health-check"] = extractedValue
    }
];
