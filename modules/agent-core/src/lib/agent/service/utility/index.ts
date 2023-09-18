import { TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { SocketMessage } from "@core-lib/platform/api/socket";

/**
 * Creates a TaskResult object with the specified status.
 *
 * @param status TaskStatus enum constant value to be included in the result
 */
export const createTaskResult = (status: TaskStatus): TaskResult => {
    return { status };
}

/**
 * Sends the given message via the active websocket instance. Also runs the given callback function after sending the
 * message, if defined.
 *
 * @param context TaskContext object containing the active websocket instance
 * @param message raw message object wrapped in SocketMessage to be sent
 * @param callback optional arbitrary callback function
 */
export const sendMessage = (context: TaskContext, message: SocketMessage<any>, callback?: (error?: Error) => void): void => {

    const jsonResponse = JSON.stringify(message);
    context.socket?.send(jsonResponse, callback);
}
