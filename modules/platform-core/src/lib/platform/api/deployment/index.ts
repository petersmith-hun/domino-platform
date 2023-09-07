/**
 * Supported filesystem based execution types.
 */
export enum FilesystemExecutionType {

    EXECUTABLE = "executable",
    SERVICE = "service",
    RUNTIME = "runtime"
}

/**
 * Supported Docker execution types.
 */
export enum DockerExecutionType {

    STANDARD = "standard"
}

/**
 * Combined type for all supported execution type.
 */
export type ExecutionType = DockerExecutionType | FilesystemExecutionType;

/**
 * Supported source types.
 */
export enum SourceType {

    DOCKER = "docker",
    FILESYSTEM = "filesystem"
}

/**
 * Deployment source configuration parameters.
 */
export interface DeploymentSource {

    type: SourceType;
    home: string;
    resource: string;
}

/**
 * Deployment target configuration parameters.
 */
export interface DeploymentTarget {

    hosts: string[];
}

/**
 * Docker execution configuration parameters.
 */
export interface DockerArguments {

    commandArgs?: string[];
    environment?: Map<string, string>;
    volumes?: Map<string, string>;
    ports?: Map<string, string>;
    restartPolicy?: string;
    networkMode?: string;
    custom?: string;
}

/**
 * General deployment execution configuration parameters.
 */
export interface DeploymentExecution {

    commandName: string;
    asUser?: string;
    via: ExecutionType;
    runtime?: string;
    args?: string[] | DockerArguments;
}

/**
 * Deployment info configuration parameters.
 */
export interface DeploymentInfo {

    endpoint: string;
    fieldMapping: Map<string, string>;
}

/**
 * Deployment healthcheck configuration parameters.
 */
export interface DeploymentHealthcheck {

    endpoint: string;
    delay: number;
    timeout: number;
    maxAttempts: number;
}

/**
 * Base type for matching enabled optional operations.
 */
export type EnabledDeploymentOperation = { enabled: true };

/**
 * Base type for matching disabled optional operations.
 */
export type DisabledDeploymentOperation = { enabled: false };

/**
 * DeploymentInfo configuration combined with the enabled/disabled flag.
 */
export type OptionalDeploymentInfo = (EnabledDeploymentOperation & DeploymentInfo) | DisabledDeploymentOperation;

/**
 * DeploymentHealthcheck configuration combined with the enabled/disabled flag.
 */
export type OptionalDeploymentHealthcheck = (EnabledDeploymentOperation & DeploymentHealthcheck) | DisabledDeploymentOperation;

/**
 * Deployment configuration mapping a complete deployment entry..
 */
export interface Deployment {

    id: string;
    source: DeploymentSource;
    target: DeploymentTarget;
    execution: DeploymentExecution;
    healthcheck: OptionalDeploymentHealthcheck;
    info: OptionalDeploymentInfo;
}

/**
 * RegExp matcher for valid deployment IDs.
 */
export const validIDMatcher = /^[a-z][a-z-_]*[a-z]+$/;

/**
 * RegExp matcher for valid deployment versions.
 */
export const validVersionMatcher = /^[0-9]+[.]?[A-Za-z0-9.\-_]*$/;
