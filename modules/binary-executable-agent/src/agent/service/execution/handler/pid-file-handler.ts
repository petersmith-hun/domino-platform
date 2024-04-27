import LoggerFactory from "@core-lib/platform/logging";
import fs from "node:fs";

const pidFileName = ".pid";

/**
 * Handles the PID (.pid) files placed next to the deployment executable when running.
 */
export class PIDFileHandler {

    private readonly logger = LoggerFactory.getLogger(PIDFileHandler);

    /**
     * Creates the PID file for a running process.
     *
     * @param workDirectory work directory to place the PID file in
     * @param pid PID assigned by the OS
     */
    public createPIDFile(workDirectory: string, pid: number): void {

        if (pid) {
            fs.writeFileSync(this.createPIDFilePath(workDirectory), `${pid}`);
        } else {
            this.logger.warn("Undefined PID");
        }
    }

    /**
     * Reads the PID file of a running deployment, and returns the PID itself, or undefined if the PID file does not exist.
     *
     * @param workDirectory work directory of the running deployment
     */
    public readPID(workDirectory: string): number | undefined {

        const pidFilePath = this.createPIDFilePath(workDirectory);
        if (!fs.existsSync(pidFilePath)) {
            this.logger.warn(`PID file does not exist under work directory ${workDirectory}`);
            return undefined;
        }

        return parseInt(fs.readFileSync(pidFilePath).toString());
    }

    /**
     * Deletes the PID file of a stopped deployment.
     *
     * @param workDirectory work directory of the running deployment
     */
    public deletePIDFile(workDirectory: string): void {
        fs.rmSync(this.createPIDFilePath(workDirectory));
    }

    private createPIDFilePath(workDirectory: string) {
        return `${workDirectory}/${pidFileName}`;
    }
}

export const pidFileHandler = new PIDFileHandler();
