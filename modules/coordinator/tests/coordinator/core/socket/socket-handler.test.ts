import { AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import { DelegatingMessageProcessor, MessageProcessor } from "@coordinator/core/socket/message";
import { SocketHandler } from "@coordinator/core/socket/socket-handler";
import { agentLocalhostDocker, deploySocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests SocketHandler", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let messageProcessorMock: SinonStubbedInstance<MessageProcessor<any>>;
    let agentRegistryMock: SinonStubbedInstance<AgentRegistry>;
    let socketHandler: SocketHandler;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        messageProcessorMock = sinon.createStubInstance(DelegatingMessageProcessor);
        agentRegistryMock = sinon.createStubInstance(AgentRegistry);

        socketHandler = new SocketHandler(messageProcessorMock, agentRegistryMock);
    });

    describe("Test scenarios for #attachListener", () => {

        it("should attach the message, close and error listeners", () => {

            // when
            socketHandler.attachListener(socketMock);

            // then
            sinon.assert.calledWith(socketMock.on, "message");
            sinon.assert.calledWith(socketMock.on, "close");
            sinon.assert.calledWith(socketMock.on, "error");
        });

        it("should pass the message event to the message processor", () => {

            // given
            const buffer = Buffer.from(JSON.stringify(deploySocketMessage));

            // when
            socketHandler.attachListener(socketMock);

            // then
            socketMock.on.getCalls()[0].callArgWith(1, buffer);
            sinon.assert.calledWith(messageProcessorMock.process, socketMock, deploySocketMessage);
        });

        it("should request to mark the agent disconnected on close event", () => {

            // when
            socketHandler.attachListener(socketMock);

            // then
            socketMock.on.getCalls()[1].callArgWith(1);
            sinon.assert.calledWith(agentRegistryMock.identifyAgent, socketMock);
            sinon.assert.calledWith(agentRegistryMock.markAgentDisconnected, socketMock);
        });

        it("should log error event from unidentified agent", () => {

            // when
            socketHandler.attachListener(socketMock);

            // then
            socketMock.on.getCalls()[2].callArgWith(1, new Error("Something went wrong"));
            sinon.assert.calledWith(agentRegistryMock.identifyAgent, socketMock);
        });

        it("should log error event identified agent", () => {

            // given
            agentRegistryMock.identifyAgent.withArgs(socketMock).returns(agentLocalhostDocker);

            // when
            socketHandler.attachListener(socketMock);

            // then
            socketMock.on.getCalls()[2].callArgWith(1, new Error("Something went wrong"));
            sinon.assert.calledWith(agentRegistryMock.identifyAgent, socketMock);
        });
    });
});
