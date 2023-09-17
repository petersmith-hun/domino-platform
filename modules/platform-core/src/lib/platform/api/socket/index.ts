import { Deployment, SourceType } from "@core-lib/platform/api/deployment";
import { DeploymentVersion } from "@core-lib/platform/api/lifecycle";

/**
 * Supported websocket message types.
 */
export enum MessageType {

    /**
     * Outgoing - Agent announcement.
     */
    ANNOUNCEMENT = "ANNOUNCEMENT",

    /**
     * Outgoing - Lifecycle command execution result.
     */
    RESULT = "RESULT",

    /**
     * Outgoing - Processing failure.
     */
    FAILURE = "FAILURE",

    /**
     * Outgoing - Connection keep-alive request.
     */
    PING = "PING",

    /**
     * Incoming - Agent announcement confirmation.
     */
    CONFIRMATION = "CONFIRMATION",

    /**
     * Incoming - Lifecycle command.
     */
    LIFECYCLE = "LIFECYCLE",

    /**
     * Incoming - Connection keep-alive request confirmation.
     */
    PONG = "PONG"
}

/**
 * Supported lifecycle commands.
 */
export enum LifecycleCommand {

    /**
     * Deploy the given version of the application.
     */
    DEPLOY = "DEPLOY",

    /**
     * Start the deployed version of the application.
     */
    START = "START",

    /**
     * Stop the running version of the application.
     */
    STOP = "STOP",

    /**
     * Restart the running version of the application.
     */
    RESTART = "RESTART"
}

/**
 * Socket message wrapper type.
 *
 * @param T type of the message payload
 */
export interface SocketMessage<T> {

    messageID: string;
    messageType: MessageType;
    payload: T;
}

/**
 * Announcement message contents.
 */
export interface Announcement {

    agentKey: string;
    hostID: string;
    type: SourceType;
}

/**
 * Announcement confirmation message contents.
 */
export interface Confirmation {

    message: string;
}

/**
 * Failure message contents.
 */
export interface Failure {

    message: string;
}

/**
 * Lifecycle message contents.
 */
export interface Lifecycle {

    command: LifecycleCommand;
    deployment: Deployment;
    version?: DeploymentVersion
}

/**
 * Type override to easily distinguish confirmation socket messages. Message payload is considered to be Confirmation,
 * when the message type defined in the SocketMessage wrapper is CONFIRMATION.
 */
export type ConfirmationMessage = SocketMessage<Confirmation> & { messageType: MessageType.CONFIRMATION };

/**
 * Type override to easily distinguish lifecycle socket messages. Message payload is considered to be Lifecycle,
 * when the message type defined in the SocketMessage wrapper is LIFECYCLE.
 */
export type LifecycleMessage = SocketMessage<Lifecycle> & { messageType: MessageType.LIFECYCLE };

/**
 * Type override to easily distinguish pong socket messages. Message payload is considered to be undefined,
 * when the message type defined in the SocketMessage wrapper is PONG.
 */
export type PongMessage = SocketMessage<undefined> & { messageType: MessageType.PONG };
