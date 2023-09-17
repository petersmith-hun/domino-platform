import { MessageHandler } from "@core-lib/agent/service/message";
import { TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { CommandListenerLoopTask } from "@core-lib/agent/service/task/command-listener-loop-task";
import { Failure, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { confirmationMessage, pingMessage, pongMessage, startMessage } from "@testdata";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for CommandListenerLoopTask", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let messageHandlerConfirmationMock: SinonStubbedInstance<MessageHandler<any>>;
    let messageHandlerLifecycleMock: SinonStubbedInstance<MessageHandler<any>>;
    let messageHandlerPongMock: SinonStubbedInstance<MessageHandler<any>>;
    let commandListenerLoopTask: CommandListenerLoopTask;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        messageHandlerConfirmationMock = sinon.createStubInstance(MessageHandlerStub);
        messageHandlerConfirmationMock.forMessageType.returns(MessageType.CONFIRMATION);
        messageHandlerLifecycleMock = sinon.createStubInstance(MessageHandlerStub);
        messageHandlerLifecycleMock.forMessageType.returns(MessageType.LIFECYCLE);
        messageHandlerPongMock = sinon.createStubInstance(MessageHandlerStub);
        messageHandlerPongMock.forMessageType.returns(MessageType.PONG);

        commandListenerLoopTask = new CommandListenerLoopTask([
            messageHandlerConfirmationMock,
            messageHandlerLifecycleMock,
            messageHandlerPongMock
        ]);
    });

    describe("Test scenarios for #run", () => {

        it("should attach on-message listener to the socket and immediately return with RUNNING status", async () => {

            // given
            const context = {
                socket: socketMock
            } as unknown as TaskContext;

            // when
            const result = await commandListenerLoopTask.run(context);

            // then
            expect(result).toStrictEqual({ status: TaskStatus.RUNNING });
            sinon.assert.calledWith(socketMock.on, "message");
        });

        type Scenario = {
            message: SocketMessage<any>,
            expectedMockCall: () => SinonStub
        };

        const scenarios: Scenario[] = [
            { message: confirmationMessage, expectedMockCall: () => messageHandlerConfirmationMock.process },
            { message: startMessage, expectedMockCall: () => messageHandlerLifecycleMock.process },
            { message: pongMessage(pingMessage), expectedMockCall: () => messageHandlerPongMock.process }
        ];

        scenarios.forEach(scenario => {
            it(`should delegate processing message to the ${scenario.message.messageType} message handler`, async () => {

                // given
                const context = {
                    socket: socketMock
                } as unknown as TaskContext;

                const rawData = Buffer.from(JSON.stringify(scenario.message));

                // when
                await commandListenerLoopTask.run(context);
                socketMock.on.callArgWith(1, rawData);

                // then
                sinon.assert.calledWith(scenario.expectedMockCall(), context, scenario.message);
            });
        });

        it("should send failure message if incoming message cannot be processed", async () => {

            // given
            const context = {
                socket: socketMock
            } as unknown as TaskContext;

            const rawData = Buffer.from(JSON.stringify(startMessage));

            const expectedFailureMessage = JSON.stringify({
                messageID: startMessage.messageID,
                messageType: MessageType.FAILURE,
                payload: {
                    message: "Unexpected error occurred while processing the message: Something went wrong"
                }
            } as SocketMessage<Failure>);

            messageHandlerLifecycleMock.process.throws(new Error("Something went wrong"));

            // when
            await commandListenerLoopTask.run(context);
            socketMock.on.callArgWith(1, rawData);

            // then
            sinon.assert.calledWith(socketMock.send, expectedFailureMessage);
        });

        it("should ignore malformed incoming message", async () => {

            // given
            const context = {
                socket: socketMock
            } as unknown as TaskContext;

            const rawData = Buffer.from("<html></html>");

            // when
            await commandListenerLoopTask.run(context);
            socketMock.on.callArgWith(1, rawData);

            // then
            sinon.assert.notCalled(socketMock.send);
            sinon.assert.notCalled(messageHandlerConfirmationMock.process);
            sinon.assert.notCalled(messageHandlerLifecycleMock.process);
            sinon.assert.notCalled(messageHandlerPongMock.process);
        });
    });
});

class MessageHandlerStub implements MessageHandler<any> {

    forMessageType(): MessageType {
        return MessageType.CONFIRMATION;
    }

    process(context: TaskContext, message: SocketMessage<any>): void {}
}
