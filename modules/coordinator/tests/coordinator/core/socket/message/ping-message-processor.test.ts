import { PingMessageProcessor } from "@coordinator/core/socket/message/ping-message-processor";
import { MessageType } from "@core-lib/platform/api/socket";
import { pingSocketMessage, pongSocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for PingMessageProcessor", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let pingMessageProcessor: PingMessageProcessor;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        pingMessageProcessor = new PingMessageProcessor();
    });

    describe("Test scenarios for #process", () => {

        it("should respond to the ping message with a pong message", () => {

            // when
            pingMessageProcessor.process(socketMock, pingSocketMessage);

            // then
            sinon.assert.calledWith(socketMock.send, JSON.stringify(pongSocketMessage));
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should always return MessageType.PING", () => {

            // when
            const result = pingMessageProcessor.forMessageType();

            // then
            expect(result).toBe(MessageType.PING);
        });
    });
});
