import { SpawnParameters } from "@bin-exec-agent/domain/common";
import { pidFileHandler, PIDFileHandler } from "@bin-exec-agent/service/execution/handler/pid-file-handler";
import { commandLineUtility, CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";
import { ChildProcess } from "child_process";

/**
 * Process operations.
 */
export class ProcessHandler {

    private readonly logger = LoggerFactory.getLogger(ProcessHandler);

    private readonly trackedProcesses: Map<SpawnParameters, ChildProcess> = new Map<SpawnParameters, ChildProcess>();
    private readonly pidFileHandler: PIDFileHandler;
    private readonly commandLineUtility: CommandLineUtility;

    constructor(pidFileHandler: PIDFileHandler, commandLineUtility: CommandLineUtility) {
        this.pidFileHandler = pidFileHandler;
        this.commandLineUtility = commandLineUtility;
    }

    /**
     * Spawns a process for the deployment using ChildProcess API. Returns the PID on success by resolving the Promise,
     * or rejects it on failure.
     *
     * @param spawnParameters parameters to be passed to child_process.spawn command
     */
    public async spawn(spawnParameters: SpawnParameters): Promise<number> {

        return new Promise((resolve, reject) => {

            const spawnedProcess = this.commandLineUtility.spawn(spawnParameters.executablePath, spawnParameters.arguments, {
                uid: spawnParameters.userID,
                cwd: spawnParameters.workDirectory,
                detached: true,
                stdio: "ignore"
            }).on("spawn", () => {
                this.pidFileHandler.createPIDFile(spawnParameters.workDirectory, spawnedProcess.pid);
                this.trackProcess(spawnParameters, spawnedProcess);
                spawnedProcess.unref();
                resolve(spawnedProcess.pid!);
            }).on("error", error => {
                this.logger.error(`Failed to spawn application - reason: ${error?.message}`);
                reject(error);
            });
        })
    }

    /**
     * Stops a running deployment process. It resolves the PID of the process by either grabbing it from the in-memory
     * process tracking, or reading the PID file in the work directory. Returns UNKNOWN_STOPPED status, if the running
     * process cannot be found, STOP_FAILURE status if an error occurs while stopping the process, or STOPPED status on
     * successfully killing the process.
     *
     * @param spawnParameters original parameters used for spawning the process (used in process tracking)
     */
    public kill(spawnParameters: SpawnParameters): DeploymentStatus {

        const pid = this.trackedProcesses.get(spawnParameters)?.pid ?? this.pidFileHandler.readPID(spawnParameters.workDirectory);
        let deploymentStatus = DeploymentStatus.UNKNOWN_STOPPED;

        if (pid) {
            deploymentStatus = this.killProcessGroup(pid);
            this.pidFileHandler.deletePIDFile(spawnParameters.workDirectory);
            this.trackedProcesses.delete(spawnParameters);
        } else {
            this.logger.warn(`PID not available for ${spawnParameters.deploymentID}, assuming process is not running ...`);
        }

        return deploymentStatus;
    }

    private trackProcess(spawnParameters: SpawnParameters, spawnedProcess: ChildProcess): void {
        this.trackedProcesses.set(spawnParameters, spawnedProcess);
    }

    private killProcessGroup(parentPID: number): DeploymentStatus {

        let deploymentStatus = DeploymentStatus.STOPPED;
        try {
            process.kill(-parentPID);
            this.logger.info(`Kill signal sent to the process group of PID ${parentPID}`);

        } catch (error: any) {
            this.logger.error(`Failed to kill process group of PID ${parentPID} - reason: ${error?.message}`);
            deploymentStatus = DeploymentStatus.STOP_FAILURE;
        }

        return deploymentStatus;
    }
}

export const processHandler = new ProcessHandler(pidFileHandler, commandLineUtility);
