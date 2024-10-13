import { DeploymentSummary } from "@coordinator/core/domain";
import { DeploymentDefinition } from "@coordinator/core/domain/storage";

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
        resource: deployment.definition.source.resource
    }
}
