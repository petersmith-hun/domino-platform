import { LifecycleOperationRegistry } from "@coordinator/core/socket/lifecycle-operation-registry";
import { LifecycleResultMessageProcessor } from "@coordinator/core/socket/message/lifecycle-result-message-processor";
import { MessageType } from "@core-lib/platform/api/socket";
import { deploySocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for LifecycleResultMessageProcessor", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let lifecycleOperationRegistryMock: SinonStubbedInstance<LifecycleOperationRegistry>;
    let lifecycleResultMessageProcessor: LifecycleResultMessageProcessor;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        lifecycleOperationRegistryMock = sinon.createStubInstance(LifecycleOperationRegistry);

        lifecycleResultMessageProcessor = new LifecycleResultMessageProcessor(lifecycleOperationRegistryMock);
    });

    describe("Test scenarios for #process", () => {

        it("should try to finish the active command based on the result message", () => {

            // when
            lifecycleResultMessageProcessor.process(socketMock, deploySocketMessage);

            // then
            sinon.assert.calledWith(lifecycleOperationRegistryMock.operationFinished, deploySocketMessage.messageID, deploySocketMessage.payload);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should always return MessageType.RESULT", () => {

            // when
            const result = lifecycleResultMessageProcessor.forMessageType();

            // then
            expect(result).toBe(MessageType.RESULT);
        });
    });
});
