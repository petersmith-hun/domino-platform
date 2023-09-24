import { socketHandler, SocketHandler } from "@coordinator/core/socket/socket-handler";
import { agentAuthorizer, AgentAuthorizer } from "@coordinator/web/socket/agent-authorizer";
import { Server } from "http";
import { WebSocketServer } from "ws";

type ServerFactoryFunction = (httpServer: Server) => WebSocketServer;

/**
 * WebSocket server operations.
 */
export class AgentServer {

    private readonly defaultServerFactory: ServerFactoryFunction = httpServer => new WebSocketServer({
        server: httpServer,
        clientTracking: true,
        path: "/agent"
    });

    private readonly agentAuthorizer: AgentAuthorizer;
    private readonly socketHandler: SocketHandler;
    private webSocketServer!: WebSocketServer;

    constructor(agentAuthorizer: AgentAuthorizer, socketHandler: SocketHandler) {
        this.agentAuthorizer = agentAuthorizer;
        this.socketHandler = socketHandler;
    }

    /**
     * Creates a websocket server instance, attaching it to the given HTTP server instance (provided by Express).
     *
     * @param httpServer HTTP server instance provided by Express, to attach the websocket server to
     * @param serverFactory optional server factory function to configure the socket server (a default configuration is used if not provided)
     */
    public createServer(httpServer: Server, serverFactory: ServerFactoryFunction = this.defaultServerFactory): void {
        this.webSocketServer = serverFactory(httpServer);
    }

    /**
     * Instructs the created websocket server to start listening to incoming connection attempts. Upon connection, it
     * tries authorizing the agent, and if that's successful, attached the socket message listeners.
     */
    public startServer(): void {

        this.webSocketServer.on("connection", (socket, request) => {

            if (!this.agentAuthorizer.authorize(socket, request)) {
                return;
            }

            this.socketHandler.attachListener(socket);
        });
    }
}

export const agentServer = new AgentServer(agentAuthorizer, socketHandler);
