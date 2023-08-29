import { DeploymentAttributes } from "@coordinator/core/domain";
import { deploymentFacade, DeploymentFacade } from "@coordinator/core/service/deployment-facade";
import { Controller, ControllerType, getProcessingTime } from "@coordinator/web/controller/controller";
import { lifecycleRequestConverter, operationResultConverter } from "@coordinator/web/conversion";
import { ResponseWrapper } from "@coordinator/web/model/common";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { mapDeploymentStatusToStatusCode, mapInfoStatusToStatusCode } from "@coordinator/web/utility/status-mapping";
import { Validated } from "@coordinator/web/utility/validator";
import { OperationResult } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Controller implementation to handle lifecycle of registered applications.
 */
export class LifecycleController implements Controller {

    private readonly logger = LoggerFactory.getLogger(LifecycleController);

    private readonly deploymentFacade: DeploymentFacade;

    constructor(deploymentFacade: DeploymentFacade) {
        this.deploymentFacade = deploymentFacade;
    }

    /**
     * GET /lifecycle/:app/info
     * Retrieves information of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    @Validated()
    async getInfo(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<object>> {

        this.logger.info(`Requested info for deployment=${lifecycleRequest.deployment}`);

        const deploymentAttributes = lifecycleRequestConverter(lifecycleRequest);
        const infoResponse = await this.deploymentFacade.info(deploymentAttributes);
        const status = mapInfoStatusToStatusCode(infoResponse.status);

        return new ResponseWrapper(status, infoResponse.info!);
    }

    /**
     * PUT /lifecycle/:app/deploy[/:version]
     * Prepares given application for execution.
     * Omitting version path parameter instructs Domino to select the latest available version.
     *
     * @param lifecycleRequest VersionedLifecycleRequest object containing information about the target deployment
     */
    @Validated()
    async deploy(lifecycleRequest: VersionedLifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Requested updating deployment=${lifecycleRequest.deployment} to version=${lifecycleRequest.version ?? "latest"}`);

        return this.executeLifecycleRequest(lifecycleRequest, deploymentAttributes => this.deploymentFacade.deploy(deploymentAttributes));
    }

    /**
     * PUT /lifecycle/:app/start
     * Starts the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    @Validated()
    async start(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Starting deployment=${lifecycleRequest.deployment}...`);

        return this.executeLifecycleRequest(lifecycleRequest, deploymentAttributes => this.deploymentFacade.start(deploymentAttributes));
    }

    /**
     * DELETE /lifecycle/:app/stop
     * Stops the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    @Validated()
    async stop(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Stopping deployment=${lifecycleRequest.deployment}...`);

        return this.executeLifecycleRequest(lifecycleRequest, deploymentAttributes => this.deploymentFacade.stop(deploymentAttributes));
    }

    /**
     * PUT /lifecycle/:app/restart
     * Restarts the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    @Validated()
    async restart(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Restarting deployment=${lifecycleRequest.deployment}...`);

        return this.executeLifecycleRequest(lifecycleRequest, deploymentAttributes => this.deploymentFacade.restart(deploymentAttributes));
    }

    private async executeLifecycleRequest(lifecycleRequest: LifecycleRequest,
                                          operation: (deploymentAttributes: DeploymentAttributes) => Promise<OperationResult>):
        Promise<ResponseWrapper<LifecycleResponse>> {

        const deploymentAttributes = lifecycleRequestConverter(lifecycleRequest);
        const operationResult = await operation(deploymentAttributes);
        const status = mapDeploymentStatusToStatusCode(operationResult.status);
        const content = operationResultConverter(operationResult, getProcessingTime(lifecycleRequest.callStartTime));

        return new ResponseWrapper<LifecycleResponse>(status, content);
    }

    controllerType(): ControllerType {
        return ControllerType.LIFECYCLE;
    }
}

export const lifecycleController = new LifecycleController(deploymentFacade);
