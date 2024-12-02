import { applyJSONDataFix } from "@coordinator/core/config/deployment/loader";
import { DeploymentSummary, Page } from "@coordinator/core/domain";
import { DeploymentDefinition } from "@coordinator/core/domain/storage";
import { DeploymentExport, ExtendedDeployment } from "@coordinator/web/model/deployment";
import { Deployment } from "@core-lib/platform/api/deployment";
import * as yaml from "js-yaml";

/**
 * Converts the given deployment definition (of type DeploymentDefinition) to DeploymentSummary.
 *
 * @param deployment deployment definition to be converted
 */
export const deploymentSummaryConverter = (deployment: DeploymentDefinition): DeploymentSummary => {

    return {
        id: deployment.id,
        sourceType: deployment.definition.source.type,
        executionType: deployment.definition.execution.via,
        home: deployment.definition.source.home,
        resource: deployment.definition.source.resource,
        locked: deployment.locked
    }
}

/**
 * Converts a page of DeploymentDefinition objects into a page of DeploymentSummary objects.
 *
 * @param page Page object containing the page attributes and the items on the page
 */
export const deploymentDefinitionPageConverter = (page: Page<DeploymentDefinition>): Page<DeploymentSummary> => {

    return {
        ...page,
        items: page.items.map(deploymentSummaryConverter)
    }
}

/**
 * Converts a DeploymentDefinition object into ExtendedDeployment object by taking the deployment definition itself and
 * appending a metadata section, containing the lock status, creation and last update date.
 *
 * @param deploymentDefinition DeploymentDefinition object to be converted into ExtendedDeployment
 */
export const extendedDeploymentConverter = (deploymentDefinition: DeploymentDefinition): ExtendedDeployment => {

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
 * Converts a Deployment object into a DeploymentExport object by converting the definition to YAML-string and writing
 * it into the "definition" field.
 *
 * @param deployment Deployment to be converted for export
 */
export const yamlExporter = (deployment: Deployment): DeploymentExport => {

    const id = deployment.id;
    const reformattedDeployment: any = applyJSONDataFix(deployment);
    delete reformattedDeployment.domino.deployments[id].id;
    delete reformattedDeployment.domino.deployments[id].execution?.asUser;
    delete reformattedDeployment.domino.deployments[id].execution?.commandName;
    delete reformattedDeployment.domino.deployments[id].execution?.args?.networkMode;
    delete reformattedDeployment.domino.deployments[id].execution?.args?.restartPolicy;
    delete reformattedDeployment.domino.deployments[id].healthcheck;
    delete reformattedDeployment.domino.deployments[id]["health-check"].maxAttempts;
    delete reformattedDeployment.domino.deployments[id].info?.fieldMapping;

    return {
        definition: yaml.dump(reformattedDeployment)
    }
}
