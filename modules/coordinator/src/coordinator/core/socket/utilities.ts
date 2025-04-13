import { Secret } from "@coordinator/core/domain/storage";
import { SocketMessage } from "@core-lib/platform/api/socket";
import { WebSocket } from "ws";

const secretPlaceholderPattern = /\[dsm:([a-zA-Z][a-zA-Z0-9_.:\-]*)]/g;

/**
 * Sends the given message via the provided websocket instance.
 *
 * @param socket WebSocket instance opened by the agent
 * @param message raw message object wrapped in SocketMessage to be sent
 * @param secrets secrets to be resolved, if empty, skips secret resolution
 */
export const sendMessage = (socket: WebSocket, message: SocketMessage<any>, secrets: Secret[] = []): void => {

    const jsonMessage = resolveSecrets(message, secrets);
    socket.send(jsonMessage);
}

const resolveSecrets = (message: SocketMessage<any>, secrets: Secret[]): string => {

    const messageContent = JSON.stringify(message);

    if (secrets.length === 0) {
        return messageContent;
    }

    const secretMap = new Map<string, string>(secrets.map(secret => [secret.key, secret.value]));

    return messageContent.replaceAll(
        secretPlaceholderPattern,
        (_, args) => secretMap.get(args) ?? "");
}
