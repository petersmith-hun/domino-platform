import { Agent } from "@coordinator/core/config/agent-config-module";
import { DeploymentAttributes, DeploymentSummary, Page } from "@coordinator/core/domain";
import { Attempt } from "@coordinator/core/service/healthcheck";
import { DeploymentInfoResponse, InfoStatus } from "@coordinator/core/service/info";
import {
    Deployment,
    DeploymentHealthcheck,
    DeploymentInfo,
    OptionalDeploymentHealthcheck,
    OptionalDeploymentInfo,
    SourceType
} from "@core-lib/platform/api/deployment";
import { DeploymentStatus, OperationResult } from "@core-lib/platform/api/lifecycle";
import { Announcement, Confirmation, Failure, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { dockerAllArgsDeployment } from "@testdata/deployment";

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
    fieldMapping: {
        appName: "$.app.name",
        abbreviation: "$.app.abbreviation",
        version: "$.build.version"
    }
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
    target: {
        hosts: ["localhost"]
    },
    source: {
        type: SourceType.DOCKER
    },
    info: optionalDeploymentInfo,
    healthcheck: optionalDeploymentHealthcheck
} as Deployment;

export const deploymentWithoutAgent: Deployment = {
    id: "domino",
    target: {
        hosts: ["other-host"]
    },
    source: {
        type: SourceType.DOCKER
    },
    info: optionalDeploymentInfo,
    healthcheck: optionalDeploymentHealthcheck
} as Deployment;

export const agentLocalhostDocker = new Agent("2ce1fba7-aedb-42b5-9033-f9fdd067bba5", "localhost", SourceType.DOCKER);
export const agentRemoteFilesystem = new Agent("05a66ac8-adeb-4d96-a108-f78ed80723a8", "remote", SourceType.FILESYSTEM);

export const deploySocketMessage: SocketMessage<OperationResult> = {
    messageID: "message-start-1",
    messageType: MessageType.RESULT,
    payload: versionedDeployOperationResult
}

export const failureSocketMessage: SocketMessage<Failure> = {
    messageID: "message-failure-1",
    messageType: MessageType.FAILURE,
    payload: {
        message: "Something went wrong"
    }
}

export const pingSocketMessage: SocketMessage<undefined> = {
    messageID: "ping-message-1",
    messageType: MessageType.PING,
    payload: undefined
}

export const pongSocketMessage: SocketMessage<undefined> = {
    messageID: pingSocketMessage.messageID,
    messageType: MessageType.PONG,
    payload: undefined
}

export const announcementSocketMessage: SocketMessage<Announcement> = {
    messageID: `announce:${agentLocalhostDocker.agentID}`,
    messageType: MessageType.ANNOUNCEMENT,
    payload: {
        hostID: agentLocalhostDocker.hostID,
        type: agentLocalhostDocker.type,
        agentKey: agentLocalhostDocker.agentKey
    }
}

export const unknownAnnouncementSocketMessage: SocketMessage<Announcement> = {
    messageID: `announce:unknown-agent`,
    messageType: MessageType.ANNOUNCEMENT,
    payload: {
        hostID: "unknown-host",
        type: SourceType.DOCKER,
        agentKey: "unknown-key"
    }
}

export const confirmationSocketMessage: SocketMessage<Confirmation> = {
    messageID: `confirmation:${agentLocalhostDocker.agentID}`,
    messageType: MessageType.CONFIRMATION,
    payload: {
        message: `Agent accepted as [${agentLocalhostDocker.agentID}] with status [TRACKED]`
    }
}

export const deploymentSummary: DeploymentSummary = {
    id: dockerAllArgsDeployment.id,
    home: dockerAllArgsDeployment.source.home,
    resource: dockerAllArgsDeployment.source.resource,
    sourceType: dockerAllArgsDeployment.source.type,
    executionType: dockerAllArgsDeployment.execution.via
}

export const pagedDeployments: Page<Deployment> = {
    pageNumber: 2,
    pageSize: 5,
    itemCountOnPage: 1,
    totalPages: 2,
    totalItemCount: 6,
    items: [
        dockerAllArgsDeployment
    ]
}

export const pagedDeploymentSummaries: Page<DeploymentSummary> = {
    pageNumber: 2,
    pageSize: 5,
    itemCountOnPage: 1,
    totalPages: 2,
    totalItemCount: 6,
    items: [
        deploymentSummary
    ]
}
