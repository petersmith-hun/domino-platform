import { ConfirmationMessageHandler } from "@core-lib/agent/service/message/confirmation-message-handler";
import { AgentStatus, TaskContext } from "@core-lib/agent/service/task";
import { MessageType } from "@core-lib/platform/api/socket";
import { confirmationMessage } from "@testdata";

describe("Unit tests for ConfirmationMessageHandler", () => {

    let confirmationMessageHandler: ConfirmationMessageHandler;

    beforeEach(() => {
        confirmationMessageHandler = new ConfirmationMessageHandler();
    });

    describe("Test scenarios for #process", () => {

        it("should set the agent status to listening", () => {

            // given
            const context = {
                agentStatus: AgentStatus.ANNOUNCED
            } as TaskContext;

            // when
            confirmationMessageHandler.process(context, confirmationMessage);

            // then
            expect(context.agentStatus).toBe(AgentStatus.LISTENING);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should return CONFIRMATION", () => {

            // when
            const result = confirmationMessageHandler.forMessageType();

            // then
            expect(result).toBe(MessageType.CONFIRMATION);
        });
    });
});
