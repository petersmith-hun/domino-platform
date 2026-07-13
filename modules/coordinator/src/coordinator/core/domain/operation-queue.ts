import { DeploymentStatus, OperationResult } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Queue for executing deployment operations in sequence.
 */
export class OperationQueue {

    private readonly logger = LoggerFactory.getLogger(OperationQueue);
    private readonly errorStates = [
        DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION,
        DeploymentStatus.DEPLOY_FAILED_UNKNOWN,
        DeploymentStatus.HEALTH_CHECK_FAILURE,
        DeploymentStatus.INVALID_REQUEST,
        DeploymentStatus.START_FAILURE,
        DeploymentStatus.STOP_FAILURE,
        DeploymentStatus.TIMEOUT
    ];

    private readonly queue: (() => Promise<OperationResult>)[] = [];
    private readonly deploymentID: string;
    private lastResult: OperationResult | undefined;

    private constructor(deploymentID: string) {
        this.deploymentID = deploymentID;
    }

    /**
     * Creates a new OperationQueue instance.
     *
     * @param deploymentID ID of the deployment for which the queue is created
     */
    public static create(deploymentID: string): OperationQueue {
        return new OperationQueue(deploymentID);
    }

    /**
     * Returns the result of the last deployment operation.
     */
    public get lastOperationResult(): OperationResult {

        if (!this.lastResult) {
            throw new Error(`No lifecycle operation result available for deployment [${this.deploymentID}]`);
        }

        return this.lastResult;
    }

    /**
     * Enqueues the given operation to be executed in sequence.
     *
     * @param operation deployment operation to be executed
     */
    public enqueue(operation: () => Promise<OperationResult>): void {
        this.queue.push(operation);
    }

    /**
     * Executes all operations in the queue in sequence.
     */
    public async execute(): Promise<OperationResult> {

        if (this.queue.length === 0) {
            throw new Error("No lifecycle operations to execute");
        }

        this.logger.info(`Executing lifecycle operations for deployment [${this.deploymentID}]`);
        const totalSteps = this.queue.length;
        let currentStep = 1;

        do {
            const operation = this.queue.shift();
            if (!operation) {
                throw new Error("Lifecycle operation not found");
            }

            this.lastResult = await operation();

            if (this.errorStates.includes(this.lastOperationResult.status)) {
                this.logger.error(`Lifecycle operation ${currentStep}/${totalSteps} failed for deployment [${this.deploymentID}] : ${this.lastOperationResult.status}`);
                break;

            } else {
                this.logger.info(`Lifecycle operation ${currentStep}/${totalSteps} result for deployment [${this.deploymentID}] : ${this.lastOperationResult.status}`);
            }

            currentStep++;

        } while (this.queue.length > 0);

        return this.lastOperationResult;
    }
}
