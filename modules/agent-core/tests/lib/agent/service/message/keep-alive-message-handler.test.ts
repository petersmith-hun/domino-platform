import { KeepAliveMessageHandler } from "@core-lib/agent/service/message/keep-alive-message-handler";
import { TaskContext } from "@core-lib/agent/service/task";
import { MessageType } from "@core-lib/platform/api/socket";
import { pingMessage, pongMessage } from "@testdata";

describe("Unit tests for KeepAliveMessageHandler", () => {

    let keepAliveMessageHandler: KeepAliveMessageHandler;

    beforeEach(() => {
        keepAliveMessageHandler = new KeepAliveMessageHandler();
    });

    describe("Test scenarios for #process", () => {

        it("should mark ping confirmed", () => {

            // given
            const context = {
                pingConfirmed: false
            } as TaskContext;

            // when
            keepAliveMessageHandler.process(context, pongMessage(pingMessage));

            // then
            expect(context.pingConfirmed).toBe(true);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should return PONG", () => {

            // when
            const result = keepAliveMessageHandler.forMessageType();

            // then
            expect(result).toBe(MessageType.PONG);
        });
    });
});