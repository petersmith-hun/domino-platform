import { InvalidImportedDeploymentError } from "@coordinator/core/error/error-types";
import * as yaml from "js-yaml";
import ms from "ms";

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
    return loadConfigContent(() => applyJSONDataFix(content));
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

/**
 * Applies the required JSON to YAML-like data structure conversion on the given deployment definition.
 *
 * @param content deployment content to be converted
 */
export const applyJSONDataFix = (content: RawDeployment): any => {

    const updatedContent: unknown = deepCopyObject(content);
    jsonDataFixes.forEach(dataFix => {
        const extractedValue = dataFix.source(updatedContent);
        if (extractedValue) {
            dataFix.target(updatedContent, extractedValue);
        }
    });

    return {
        domino: {
            deployments: {
                [content.id]: updatedContent
            }
        }
    };
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

const deepCopyObject = (sourceObject: unknown): unknown => {
    return JSON.parse(JSON.stringify(sourceObject));
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
        source: (definition: any) => definition.healthcheck?.delay,
        target: (definition: any, extractedValue: any) => definition.healthcheck.delay = ms(extractedValue, { long: true })
    },
    {
        source: (definition: any) => definition.healthcheck?.timeout,
        target: (definition: any, extractedValue: any) => definition.healthcheck.timeout = ms(extractedValue, { long: true })
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
