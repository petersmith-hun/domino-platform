import { DelegatingMessageProcessor, MessageProcessor } from "@coordinator/core/socket/message";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { announcementSocketMessage, deploySocketMessage, pingSocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for DelegatingMessageProcessor", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let messageProcessorMock1: SinonStubbedInstance<MessageProcessor<any>>;
    let messageProcessorMock2: SinonStubbedInstance<MessageProcessor<any>>;
    let delegatingMessageProcessor: DelegatingMessageProcessor;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        messageProcessorMock1 = sinon.createStubInstance(MessageProcessorStub);
        messageProcessorMock1.forMessageType.returns(MessageType.ANNOUNCEMENT);
        messageProcessorMock2 = sinon.createStubInstance(MessageProcessorStub);
        messageProcessorMock2.forMessageType.returns(MessageType.RESULT);

        delegatingMessageProcessor = new DelegatingMessageProcessor([
            messageProcessorMock1,
            messageProcessorMock2
        ]);
    });

    describe("Test scenarios for #process", () => {

        type Scenario = {
            message: SocketMessage<any>,
            expectedMockCall: () => void
        }

        const scenarios: Scenario[] = [
            { message: announcementSocketMessage, expectedMockCall: () => sinon.assert.calledWith(messageProcessorMock1.process, socketMock, announcementSocketMessage) },
            { message: deploySocketMessage, expectedMockCall: () => sinon.assert.calledWith(messageProcessorMock2.process, socketMock, deploySocketMessage) }
        ];

        scenarios.forEach(scenario => {
            it(`should select the ${scenario.message.messageType} message processor based on socket message and delegate processing`, () => {

                // when
                delegatingMessageProcessor.process(socketMock, scenario.message);

                // then
                scenario.expectedMockCall();
            });

        });

        it("should log a message if no corresponding processor is registered", () => {

            // when
            delegatingMessageProcessor.process(socketMock, pingSocketMessage);

            // then
            sinon.assert.notCalled(messageProcessorMock1.process);
            sinon.assert.notCalled(messageProcessorMock2.process);
        });
    });
});

class MessageProcessorStub implements MessageProcessor<any>{
    process(socket: WebSocket, message: SocketMessage<any>): void {};
    forMessageType(): MessageType | undefined { return undefined; };
}
