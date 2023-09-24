import { SocketMessage } from "@core-lib/platform/api/socket";
import { WebSocket } from "ws";

/**
 * Sends the given message via the provided websocket instance.
 *
 * @param socket WebSocket instance opened by the agent
 * @param message raw message object wrapped in SocketMessage to be sent
 */
export const sendMessage = (socket: WebSocket, message: SocketMessage<any>): void => {

    const jsonResponse = JSON.stringify(message);
    socket.send(jsonResponse);
}
