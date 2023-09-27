import { AgentRegistry, AgentTrackingStatus } from "@coordinator/core/service/registry/agent-registry";
import { AnnouncementMessageProcessor } from "@coordinator/core/socket/message/announcement-message-processor";
import { MessageType } from "@core-lib/platform/api/socket";
import { agentLocalhostDocker, announcementSocketMessage, confirmationSocketMessage } from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Test scenarios for #AnnouncementMessageProcessor", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let agentRegistryMock: SinonStubbedInstance<AgentRegistry>;
    let announcementMessageProcessor: AnnouncementMessageProcessor;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        agentRegistryMock = sinon.createStubInstance(AgentRegistry);

        announcementMessageProcessor = new AnnouncementMessageProcessor(agentRegistryMock);
    });

    describe("Test scenarios for #process", () => {

        it("should confirm announcement after successfully tracking the agent", () => {

            // given
            agentRegistryMock.trackAgent.withArgs(announcementSocketMessage.payload, socketMock).returns(AgentTrackingStatus.TRACKED);
            agentRegistryMock.identifyAgent.withArgs(socketMock).returns(agentLocalhostDocker);

            // when
            announcementMessageProcessor.process(socketMock, announcementSocketMessage);

            // then
            sinon.assert.calledWith(socketMock.send, JSON.stringify(confirmationSocketMessage));
        });

        it("should terminate socket connection if agent is rejected", () => {

            // given
            agentRegistryMock.trackAgent.withArgs(announcementSocketMessage.payload, socketMock).returns(AgentTrackingStatus.REJECTED);

            // when
            announcementMessageProcessor.process(socketMock, announcementSocketMessage);

            // then
            sinon.assert.called(socketMock.terminate);
            sinon.assert.notCalled(agentRegistryMock.identifyAgent);
            sinon.assert.notCalled(socketMock.send);
        });
    });

    describe("Test scenarios for #forMessageType", () => {

        it("should always return MessageType.ANNOUNCEMENT", () => {

            // when
            const result = announcementMessageProcessor.forMessageType();

            // then
            expect(result).toBe(MessageType.ANNOUNCEMENT);
        });
    });
});
