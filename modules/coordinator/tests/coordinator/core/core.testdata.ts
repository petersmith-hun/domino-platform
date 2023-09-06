import { DeploymentAttributes } from "@coordinator/core/domain";
import { Attempt } from "@coordinator/core/service/healthcheck";
import { DeploymentInfoResponse, InfoStatus } from "@coordinator/core/service/info";
import {
    Deployment,
    DeploymentHealthcheck,
    DeploymentInfo,
    OptionalDeploymentHealthcheck,
    OptionalDeploymentInfo
} from "@core-lib/platform/api/deployment";
import { DeploymentStatus, OperationResult } from "@core-lib/platform/api/lifecycle";

export const deploymentAttributes: DeploymentAttributes = {
    deployment: "domino",
    version: undefined
}

export const versionedDeploymentAttributes: DeploymentAttributes = {
    deployment: "domino",
    version: "1.2.3"
}

export const deploymentInfoResponse: DeploymentInfoResponse = {
    status: InfoStatus.PROVIDED,
    info: {
        appName: "Leaflet Backend",
        abbreviation: "LFLT",
        version: "2.0.0"
    }
}

export const startOperationResult: OperationResult = {

    status: DeploymentStatus.HEALTH_CHECK_OK,
    deployOperation: false,
    deployedVersion: undefined
}

export const unknownStartedOperationResult: OperationResult = {

    status: DeploymentStatus.UNKNOWN_STARTED,
    deployOperation: false,
    deployedVersion: undefined
}

export const startFailureOperationResult: OperationResult = {

    status: DeploymentStatus.START_FAILURE,
    deployOperation: false,
    deployedVersion: undefined
}

export const stopOperationResult: OperationResult = {

    status: DeploymentStatus.UNKNOWN_STOPPED,
    deployOperation: false,
    deployedVersion: undefined
}

export const deployOperationResult: OperationResult = {

    status: DeploymentStatus.DEPLOYED,
    deployOperation: true,
    deployedVersion: "latest"
}

export const versionedDeployOperationResult: OperationResult = {

    status: DeploymentStatus.DEPLOYED,
    deployOperation: true,
    deployedVersion: "1.2.3"
}

export const firstAttempt: Attempt = new Attempt({
    maxAttempts: 3
} as DeploymentHealthcheck);

export const lastAttempt: Attempt = new Attempt({
    maxAttempts: 0
} as DeploymentHealthcheck);

export const deploymentInfo: DeploymentInfo = {
    endpoint: "http://localhost:9999/info",
    fieldMapping: new Map<string, string>([
        ["appName", "$.app.name"],
        ["abbreviation", "$.app.abbreviation"],
        ["version", "$.build.version"]
    ])
}

export const optionalDeploymentInfo: OptionalDeploymentInfo = {
    enabled: true,
    ... deploymentInfo
}

export const axiosInfoRequest = {
    method: "GET",
    url: deploymentInfo.endpoint
};

export const deploymentHealthcheck: DeploymentHealthcheck = {
    maxAttempts: 3,
    timeout: 1000,
    delay: 100,
    endpoint: "http://localhost:9999/health"
}

export const optionalDeploymentHealthcheck: OptionalDeploymentHealthcheck = {
    enabled: true,
    ... deploymentHealthcheck
}

export const axiosHealthcheckRequest = {
    method: "GET",
    url: deploymentHealthcheck.endpoint,
    timeout: deploymentHealthcheck.timeout
}

export const deployment: Deployment = {
    id: "domino",
    info: optionalDeploymentInfo,
    healthcheck: optionalDeploymentHealthcheck
} as Deployment;
