import { AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import { LifecycleOperationRegistry } from "@coordinator/core/socket/lifecycle-operation-registry";
import { FailureMessageProcessor } from "@coordinator/core/socket/message/failure-message-processor";
import { MessageType } from "@core-lib/platform/api/socket";
import { agentLocalhostDocker, failureSocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for FailureMessageProcessor", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let agentRegistryMock: SinonStubbedInstance<AgentRegistry>;
    let lifecycleOperationRegistryMock: SinonStubbedInstance<LifecycleOperationRegistry>;
    let failureMessageProcessor: FailureMessageProcessor;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        agentRegistryMock = sinon.createStubInstance(AgentRegistry);
        lifecycleOperationRegistryMock = sinon.createStubInstance(LifecycleOperationRegistry);

        failureMessageProcessor = new FailureMessageProcessor(agentRegistryMock, lifecycleOperationRegistryMock);
    });

    describe("Test scenarios for #process", () => {

        it("should identify the agent and try to terminate the active command", () => {

            // given
            agentRegistryMock.identifyAgent.withArgs(socketMock).returns(agentLocalhostDocker);

            // when
            failureMessageProcessor.process(socketMock, failureSocketMessage);

            // then
            sinon.assert.calledWith(agentRegistryMock.identifyAgent, socketMock);
            sinon.assert.calledWith(lifecycleOperationRegistryMock.operationFailed, failureSocketMessage.messageID, failureSocketMessage.payload);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should always return MessageType.FAILURE", () => {

            // when
            const result = failureMessageProcessor.forMessageType();

            // then
            expect(result).toBe(MessageType.FAILURE);
        });
    });
});
