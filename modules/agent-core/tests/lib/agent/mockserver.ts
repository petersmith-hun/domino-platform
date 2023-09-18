import { Confirmation, Lifecycle, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import {
    apiKey,
    confirmationMessage,
    deployMessage,
    expectedAnnouncementMessage,
    expectedResults,
    pongMessage,
    restartMessage,
    startMessage,
    stopMessage
} from "@testdata";
import ms from "ms";
import { Server, WebSocket, WebSocketServer } from "ws";
import DoneCallback = jest.DoneCallback;

let resultCounter = 0;
let totalMessageCounter = 0;
let server: Server;
let socket: WebSocket;

/**
 * Creates a mock websocket server.
 */
const createServer = (): Server => {
    return new WebSocketServer({
        port: 19987,
        clientTracking: true,
        path: "/agent"
    });
}

/**
 * Sends a message to the connected client under test.
 *
 * @param afterTime wait interval in ms format before sending the message
 * @param socket socket instance
 * @param message message to be sent
 */
const sendMessage = (afterTime: string, socket: WebSocket, message: SocketMessage<Lifecycle | Confirmation | undefined>): void => {
    setTimeout(() => socket.send(JSON.stringify(message)), ms(afterTime));
}

/**
 * Attaches the on-message listener to the given socket.
 *
 * @param server websocket server instance
 * @param socket socket instance
 * @param done Jest DoneCallback instance to terminate test execution when needed
 */
const attachMessageListener = (server: Server, socket: WebSocket, done: DoneCallback): void => {

    socket.on("message", data => {

        totalMessageCounter++;
        const message: SocketMessage<any> = JSON.parse(data.toString());

        if (message.messageType === MessageType.ANNOUNCEMENT) {
            closeOnExpectationFailure(server, socket, done,
                () => expect(message).toStrictEqual(expectedAnnouncementMessage));
            sendMessage("50 ms", socket, confirmationMessage);
        }

        if (message.messageType === MessageType.RESULT) {
            closeOnExpectationFailure(server, socket, done,
                () => expect(message).toStrictEqual(expectedResults[resultCounter++]));
        }

        if (message.messageType === MessageType.PING) {
            sendMessage("800 ms", socket, pongMessage(message));
        }
    });
}

/**
 * Closes the websocket server and socket instances, so test execution can gracefully stop.
 *
 * @param afterTime wait interval in ms format before sending the message
 * @param server websocket server instance
 * @param socket socket instance
 * @param done Jest DoneCallback instance to terminate test execution when needed
 * @param expectations Jest expectation expressions to be executed on close
 */
const closeConnection = (afterTime: string, server: Server, socket: WebSocket, done: DoneCallback, expectations?: () => void): void => {
    setTimeout(() => {
        socket.close();
        server.close();
        setTimeout(() => {
            done();
            if (expectations) {
                expectations();
            }
        }, 200);
    }, ms(afterTime));
}

/**
 * Tries executing the given Jest expectation expressions, and on failure, closes the websocket connection before
 * throwing the expectation failures.
 *
 * @param server websocket server instance
 * @param socket socket instance
 * @param done Jest DoneCallback instance to terminate test execution when needed
 * @param expectations Jest expectation expressions to be executed
 */
const closeOnExpectationFailure = (server: Server, socket: WebSocket, done: DoneCallback, expectations: () => void) => {

    try {
        expectations();
    } catch (error) {
        closeConnection("0 ms", server, socket, done);
        throw error;
    }
}

/**
 * Waits for the agent under test to connect.
 *
 * @param server websocket server instance
 * @param done Jest DoneCallback instance to terminate test execution when needed
 */
const waitForAgent = async (server: Server, done: DoneCallback): Promise<WebSocket> => {

    return new Promise(resolve => {

        server.on("connection", (socket, request) => {

            const authorization = request.headers["x-api-key"];
            const agentID = request.headers["x-agent-id"] as string;

            closeOnExpectationFailure(server, socket, done, () => {
                expect(authorization).toBe(apiKey);
                expect(agentID).toBe(agentID);
                resolve(socket);
            });
        });
    });
}

/**
 * Initializes the mock websocket server instance, and waits for the agent under test to connect. Afterward, it starts
 * executing the test steps.
 *
 * @param done Jest DoneCallback instance to terminate test execution when needed
 */
export const initServer = async (done: DoneCallback): Promise<void> => {

    resultCounter = 0;
    totalMessageCounter = 0;
    server = createServer();
    socket = await waitForAgent(server, done);

    attachMessageListener(server, socket, done);
    sendMessage("10 sec", socket, deployMessage);
    sendMessage("12 sec", socket, startMessage);
    sendMessage("14 sec", socket, stopMessage);
    sendMessage("16 sec", socket, restartMessage);
    closeConnection("18 sec", server, socket, done,
        () => expect(totalMessageCounter).toBe(8));
}
