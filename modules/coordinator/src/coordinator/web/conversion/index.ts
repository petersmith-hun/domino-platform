import { DeploymentAttributes } from "@coordinator/core/domain";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { OperationResult } from "@core-lib/platform/api/lifecycle";

/**
 * Converts the given LifecycleRequest or VersionedLifecycleRequest object to DeploymentAttributes.
 *
 * @param lifecycleRequest source object to be converted
 */
export const lifecycleRequestConverter = (lifecycleRequest: LifecycleRequest | VersionedLifecycleRequest): DeploymentAttributes => {

    return {
        deployment: lifecycleRequest.deployment,
        version: lifecycleRequest instanceof VersionedLifecycleRequest
            ? lifecycleRequest.version
            : undefined
    }
}

/**
 * Converts the given OperationResult object to LifecycleResponse. Also includes the elapsed processing time in the response.
 *
 * @param operationResult OperationResult object to be converted
 * @param processingTime calculated processing time
 */
export const operationResultConverter = (operationResult: OperationResult, processingTime: number): LifecycleResponse => {

    let lifecycleResponse: LifecycleResponse;

    if (operationResult.deployOperation) {
        lifecycleResponse = {
            version: operationResult.deployedVersion,
            message: `Deployment has finished for version=${operationResult.deployedVersion} in ${processingTime} ms`,
            status: operationResult.status
        };
    } else {
        lifecycleResponse = {
            message: `Processed in ${processingTime} ms`,
            status: operationResult.status
        };
    }

    return lifecycleResponse;
}
