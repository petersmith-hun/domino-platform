import { DeploymentSummary } from "@coordinator/core/domain";
import { Deployment } from "@core-lib/platform/api/deployment";

/**
 * Converts the given deployment definition (of type Deployment) to DeploymentSummary.
 *
 * @param deployment deployment definition to be converted
 */
export const deploymentSummaryConverter = (deployment: Deployment): DeploymentSummary => {

    return {
        id: deployment.id,
        sourceType: deployment.source.type,
        executionType: deployment.execution.via,
        home: deployment.source.home,
        resource: deployment.source.resource
    }
}
