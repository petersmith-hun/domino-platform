import { AgentConfig } from "@core-lib/agent/config/agent-common-config-module";
import { Deployment, SourceType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import {
    Announcement,
    Confirmation,
    Lifecycle,
    LifecycleCommand,
    MessageType,
    SocketMessage
} from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

export const hostID = "localhost";
export const agentType = SourceType.DOCKER;
export const agentKey = "29ebbce7-15fd-4eac-a996-f5df27d37e48";
export const agentID = `domino-agent://${hostID}/${agentType}/${agentKey}`;
export const apiKey = "3ff75fa1-2be2-4bf9-8df7-c394148e9a03";

export const agentConfig: AgentConfig = {
    coordinator: {
        host: "ws://localhost:19987/agent",
        apiKey: apiKey,
        pingInterval: 5000,
        pongTimeout: 1000
    },
    identification: {
        hostID: hostID,
        type: agentType,
        agentKey: agentKey
    }
}

export const deployMessage: SocketMessage<Lifecycle> = {
    messageID: "04f5f755-30c3-47bf-85d3-5527f0280344",
    messageType: MessageType.LIFECYCLE,
    payload: {
        command: LifecycleCommand.DEPLOY,
        deployment: {
            id: "leaflet"
        } as Deployment
    }
};

export const startMessage: SocketMessage<Lifecycle> = {
    messageID: "3d707226-4646-44bc-83fa-0036017bcc40",
    messageType: MessageType.LIFECYCLE,
    payload: {
        command: LifecycleCommand.START,
        deployment: {
            id: "leaflet"
        } as Deployment
    }
};

export const stopMessage: SocketMessage<Lifecycle> = {
    messageID: "44a15e27-fce7-4d88-9bb8-cd11bedb45d9",
    messageType: MessageType.LIFECYCLE,
    payload: {
        command: LifecycleCommand.STOP,
        deployment: {
            id: "leaflet"
        } as Deployment
    }
};

export const restartMessage: SocketMessage<Lifecycle> = {
    messageID: "ed45c582-66e9-481d-82ac-1960f4be22ff",
    messageType: MessageType.LIFECYCLE,
    payload: {
        command: LifecycleCommand.RESTART,
        deployment: {
            id: "leaflet"
        } as Deployment
    }
};

export const confirmationMessage: SocketMessage<Confirmation> = {
    messageID: "confirm",
    messageType: MessageType.CONFIRMATION,
    payload: {
        message: `${agentID} has been registered az a Docker agent running on localhost`
    }
};

export const pingMessage: SocketMessage<undefined> = {
    messageID: "ping-1",
    messageType: MessageType.PING,
    payload: undefined
}

export const pongMessage = (sourceMessage: SocketMessage<undefined>): SocketMessage<undefined> => {

    return {
        messageType: MessageType.PONG,
        messageID: sourceMessage.messageID
    } as SocketMessage<undefined>
}

export const expectedAnnouncementMessage: SocketMessage<Announcement> = {
    messageID: `announce:${agentID}`,
    messageType: MessageType.ANNOUNCEMENT,
    payload: {
        agentKey: agentKey,
        hostID: "localhost",
        type: SourceType.DOCKER,
    }
}

const result = (fromMessage: SocketMessage<Lifecycle>, status: DeploymentStatus): SocketMessage<OperationResult> => {

    return {
        messageID: fromMessage.messageID,
        messageType: MessageType.RESULT,
        payload: {
            deployOperation: status === DeploymentStatus.DEPLOYED,
            status: status
        }
    }
}

export const expectedResults: SocketMessage<OperationResult>[] = [
    result(deployMessage, DeploymentStatus.DEPLOYED),
    result(startMessage, DeploymentStatus.HEALTH_CHECK_OK),
    result(stopMessage, DeploymentStatus.STOPPED),
    result(restartMessage, DeploymentStatus.UNKNOWN_STARTED)
];

export class DummyLifecycleOperation implements LifecycleOperation {

    private readonly logger = LoggerFactory.getLogger("Dummy lifecycle operation implementation");

    deploy(_deployment: Deployment, _version: DeploymentVersion): Promise<OperationResult> {
        this.logger.info("Deploying");
        return Promise.resolve({
            status: DeploymentStatus.DEPLOYED,
            deployOperation: true
        });
    }

    start(_deployment: Deployment): Promise<OperationResult> {
        this.logger.info("Starting");
        return Promise.resolve({
            status: DeploymentStatus.HEALTH_CHECK_OK,
            deployOperation: false
        });
    }

    stop(_deployment: Deployment): Promise<OperationResult> {
        this.logger.info("Stopping");
        return Promise.resolve({
            status: DeploymentStatus.STOPPED,
            deployOperation: false
        });
    }

    restart(_deployment: Deployment): Promise<OperationResult> {
        this.logger.info("Restarting");
        return Promise.resolve({
            status: DeploymentStatus.UNKNOWN_STARTED,
            deployOperation: false
        });
    }
}

export const wait = async (intervalInMs: number): Promise<void> => {
    return await new Promise(resolve => setTimeout(resolve, intervalInMs));
}
