import { SocketHandler } from "@coordinator/core/socket/socket-handler";
import { AgentAuthorizer } from "@coordinator/web/socket/agent-authorizer";
import { AgentServer } from "@coordinator/web/socket/agent-server";
import { IncomingMessage, Server } from "http";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket, WebSocketServer } from "ws";

describe("Unit tests for AgentServer", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let incomingMessageMock: SinonStubbedInstance<IncomingMessage>;
    let httpServerMock: SinonStubbedInstance<Server>;
    let webSocketServerMock: SinonStubbedInstance<WebSocketServer>;
    let agentAuthorizerMock: SinonStubbedInstance<AgentAuthorizer>;
    let socketHandlerMock: SinonStubbedInstance<SocketHandler>;
    let agentServer: AgentServer;

    beforeEach(() => {
        httpServerMock = sinon.createStubInstance(Server);
        socketMock = sinon.createStubInstance(WebSocket);
        incomingMessageMock = sinon.createStubInstance(IncomingMessage);
        webSocketServerMock = sinon.createStubInstance(WebSocketServer);
        agentAuthorizerMock = sinon.createStubInstance(AgentAuthorizer);
        socketHandlerMock = sinon.createStubInstance(SocketHandler);

        agentServer = new AgentServer(agentAuthorizerMock, socketHandlerMock);
    });

    describe("Test scenarios for #createServer", () => {

        it("should create a websocket server and attach the given HTTP server", () => {

            // when
            agentServer.createServer(httpServerMock);

            // then
            // @ts-ignore
            const webSocketServer = agentServer.webSocketServer;
            expect(webSocketServer.options.path).toBe("/agent");
            expect(webSocketServer.options.server).toBe(httpServerMock);
            expect(webSocketServer.options.clientTracking).toBe(true);
        });
    });

    describe("Test scenarios for #startServer", () => {

        it("should attach the connection event listener to the server", () => {

            // given
            agentServer.createServer(httpServerMock, httpServer => webSocketServerMock);

            // when
            agentServer.startServer();

            // then
            sinon.assert.calledWith(webSocketServerMock.on, "connection");
        });

        it("should authorize the connecting agent successfully, then attach the further listeners", () => {

            // given
            agentServer.createServer(httpServerMock, httpServer => webSocketServerMock);
            agentServer.startServer();

            agentAuthorizerMock.authorize.withArgs(socketMock, incomingMessageMock).returns(true);

            // when
            const callback: (socket: WebSocket, request: IncomingMessage) => void = webSocketServerMock.on.getCall(0).args[1];
            callback(socketMock, incomingMessageMock);

            // then
            sinon.assert.calledWith(socketHandlerMock.attachListener, socketMock);
        });

        it("should fail to authorize the connecting agent and skip attaching the further listeners", () => {

            // given
            agentServer.createServer(httpServerMock, httpServer => webSocketServerMock);
            agentServer.startServer();

            agentAuthorizerMock.authorize.withArgs(socketMock, incomingMessageMock).returns(false);

            // when
            const callback: (socket: WebSocket, request: IncomingMessage) => void = webSocketServerMock.on.getCall(0).args[1];
            callback(socketMock, incomingMessageMock);

            // then
            sinon.assert.notCalled(socketHandlerMock.attachListener);
        });
    });
});
