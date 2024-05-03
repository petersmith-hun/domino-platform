/**
 * Deployment executor user descriptor.
 */
export interface ExecutorUser {

    /**
     * User ID as registered on the host system.
     */
    userID: number;

    /**
     * User group ID as registered on the host system.
     */
    groupID: number;
}

/**
 * Process spawn parameters.
 */
export interface SpawnParameters {

    /**
     * Deployment ID.
     */
    deploymentID: string;

    /**
     * Path of the binary to be executed.
     */
    executablePath: string;

    /**
     * Additional arguments to be passed to the process on execution.
     */
    arguments: string[];

    /**
     * Executor user ID.
     */
    userID: number;

    /**
     * Work directory of the process.
     */
    workDirectory: string;
}

/**
 * Domain object holding some commonly usable information for execution.
 */
export interface LifecycleBinaryReference {

    /**
     * Deployment ID.
     */
    deploymentID: string;

    /**
     * Work directory of the process.
     */
    workDirectory: string;

    /**
     * Path of the binary to be executed.
     */
    applicationPath: string;
}

/**
 * Domain object holding additional information above LifecycleBinaryReference for deployment operations.
 */
export interface DeploymentBinaryReference extends LifecycleBinaryReference {

    /**
     * Deployment binary source path.
     */
    sourcePath: string;

    /**
     * Deployment binary target path, including the target binary filename.
     */
    storePath: string;
}

/**
 * Supported service subsystems.
 */
export enum ServiceHandlerType {

    /**
     * Systemd service handler (service {service-name} {start|stop|restart}).
     */
    SYSTEMD = "systemd"
}
