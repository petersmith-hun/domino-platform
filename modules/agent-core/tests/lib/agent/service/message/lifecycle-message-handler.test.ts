import { LifecycleMessageHandler } from "@core-lib/agent/service/message/lifecycle-message-handler";
import { AgentStatus, TaskContext } from "@core-lib/agent/service/task";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import { Lifecycle, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import {
    agentID,
    deployMessage,
    DummyLifecycleOperation,
    expectedResults,
    restartMessage,
    startMessage,
    stopMessage,
    wait
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for ConfirmationMessageHandler", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let lifecycleOperationMock: SinonStubbedInstance<LifecycleOperation>;
    let lifecycleMessageHandler: LifecycleMessageHandler;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        lifecycleOperationMock = sinon.createStubInstance(DummyLifecycleOperation);
        lifecycleMessageHandler = new LifecycleMessageHandler(lifecycleOperationMock);
    });

    describe("Test scenarios for #process", () => {

        type Scenario = {
            message: SocketMessage<Lifecycle>,
            setMockBehavior: () => void,
            expectedMockCall: () => void
        }

        const scenarios: Scenario[] = [
            {
                message: deployMessage,
                setMockBehavior: () => lifecycleOperationMock.deploy.resolves(expectedResults[0].payload),
                expectedMockCall: () => sinon.assert.calledWith(lifecycleOperationMock.deploy, deployMessage.payload.deployment, deployMessage.payload.version)
            },
            {
                message: startMessage,
                setMockBehavior: () => lifecycleOperationMock.start.resolves(expectedResults[1].payload),
                expectedMockCall: () => sinon.assert.calledWith(lifecycleOperationMock.start, startMessage.payload.deployment)
            },
            {
                message: stopMessage,
                setMockBehavior: () => lifecycleOperationMock.stop.resolves(expectedResults[2].payload),
                expectedMockCall: () => sinon.assert.calledWith(lifecycleOperationMock.stop, stopMessage.payload.deployment)
            },
            {
                message: restartMessage,
                setMockBehavior: () => lifecycleOperationMock.restart.resolves(expectedResults[3].payload),
                expectedMockCall: () => sinon.assert.calledWith(lifecycleOperationMock.restart, restartMessage.payload.deployment)
            },
        ];

        scenarios.forEach((scenario, index) => {
            it(`should delegate processing the message to the ${scenario.message.payload.command} lifecycle handler`, async () => {

                // given
                const context = {
                    socket: socketMock,
                    agentStatus: AgentStatus.LISTENING
                } as unknown as TaskContext;

                const expectedSocketMessage = JSON.stringify({
                    messageID: scenario.message.messageID,
                    messageType: MessageType.RESULT,
                    payload: expectedResults[index].payload
                });

                scenario.setMockBehavior();

                // when
                lifecycleMessageHandler.process(context, scenario.message);
                await wait(100);

                // then
                scenario.expectedMockCall();
                sinon.assert.calledWith(socketMock.send, expectedSocketMessage);
            });
        });

        it("should report failure if agent is not yet confirmed", async () => {

            // given
            const context = {
                agentID: agentID,
                socket: socketMock,
                agentStatus: AgentStatus.INITIALIZING
            } as unknown as TaskContext;

            const expectedSocketMessage = JSON.stringify({
                messageID: `failure:${context.agentID}`,
                messageType: MessageType.FAILURE,
                payload: {
                    message: "Agent is not yet confirmed, ignoring lifecycle command"
                }
            });

            // when
            lifecycleMessageHandler.process(context, deployMessage);
            await wait(100);

            // then
            sinon.assert.calledWith(socketMock.send, expectedSocketMessage);
            sinon.assert.notCalled(lifecycleOperationMock.deploy);
            sinon.assert.notCalled(lifecycleOperationMock.start);
            sinon.assert.notCalled(lifecycleOperationMock.stop);
            sinon.assert.notCalled(lifecycleOperationMock.restart);
        });

        it("should handle unexpected errors while executing a lifecycle command", async () => {

            // given
            const context = {
                socket: socketMock,
                agentStatus: AgentStatus.LISTENING
            } as unknown as TaskContext;

            const expectedSocketMessage = JSON.stringify({
                messageID: startMessage.messageID,
                messageType: MessageType.FAILURE,
                payload: {
                    message: "Failed to execute lifecycle operation: Something went wrong"
                }
            });

            lifecycleOperationMock.start.rejects(new Error("Something went wrong"));

            // when
            lifecycleMessageHandler.process(context, startMessage);
            await wait(100);

            // then
            sinon.assert.calledWith(socketMock.send, expectedSocketMessage);
            sinon.assert.calledWith(lifecycleOperationMock.start, startMessage.payload.deployment);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should return LIFECYCLE", () => {

            // when
            const result = lifecycleMessageHandler.forMessageType();

            // then
            expect(result).toBe(MessageType.LIFECYCLE);
        });
    });
});
