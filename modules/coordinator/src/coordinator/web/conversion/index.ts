import { DefinitionSaveResult, DeploymentAttributes, Page } from "@coordinator/core/domain";
import { PageResponse } from "@coordinator/web/model/common";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { HttpStatus } from "@core-lib/platform/api/common";
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

/**
 * Converts a Page object into PageResponse. Adds some additional, calculated page attributes, to make the response
 * object compatible with Spring MVC based paginated responses.
 *
 * @param page Page object to be converted
 */
export const pageConverter = <T>(page: Page<T>): PageResponse<T> => {

    return {
        pagination: {
            pageNumber: page.pageNumber,
            pageCount: page.totalPages,
            entityCount: page.totalItemCount,
            entityCountOnPage: page.itemCountOnPage,
            first: page.pageNumber === 1,
            last: page.pageNumber === page.totalPages,
            hasNext: page.pageNumber !== page.totalPages && page.pageNumber < page.totalPages,
            hasPrevious: page.pageNumber > 1 && page.pageNumber <= page.totalPages + 1,
        },
        body: page.items
    }
}

const definitionSaveResultHttpStatusMap = new Map([
    [DefinitionSaveResult.SAVED, HttpStatus.CREATED],
    [DefinitionSaveResult.LOCKED, HttpStatus.BAD_REQUEST],
    [DefinitionSaveResult.IGNORED, HttpStatus.ACCEPTED]
]);

/**
 * Maps the deployment definition save result to HTTP status.
 * Mapping happens like this:
 *  - SAVED -> HTTP 201 Created
 *  - IGNORED -> HTTP 202 Accepted
 *  - LOCKED -> HTTP 400 Bad Request
 *
 * @param result status to be mapped
 */
export const definitionSaveResultStatusMapper = (result: DefinitionSaveResult): HttpStatus => {
    return definitionSaveResultHttpStatusMap.get(result)!;
}
