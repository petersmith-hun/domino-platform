import { AgentRegistry, AgentTrackingStatus } from "@coordinator/core/service/registry/agent-registry";
import {
    agentLocalhostDocker,
    agentRemoteFilesystem,
    announcementSocketMessage,
    deployment,
    deploymentWithoutAgent,
    unknownAnnouncementSocketMessage
} from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for AgentRegistry", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let agentRegistry: AgentRegistry;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);

        agentRegistry = new AgentRegistry([
            agentLocalhostDocker,
            agentRemoteFilesystem
        ]);
    });

    describe("Test scenarios for #trackAgent", () => {

        it("should successfully track agent", () => {

            // when
            const result = agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);

            // then
            expect(result).toBe(AgentTrackingStatus.TRACKED);
        });

        it("should reject agent", () => {

            // when
            const result = agentRegistry.trackAgent(unknownAnnouncementSocketMessage.payload, socketMock);

            // then
            expect(result).toBe(AgentTrackingStatus.REJECTED);
        });

        it("should successfully track agent as reconnected", () => {

            // given
            agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);
            agentRegistry.markAgentDisconnected(socketMock);

            // when
            const result = agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);

            // then
            expect(result).toBe(AgentTrackingStatus.RECONNECTING);
        });
    });

    describe("Test scenarios for #identifyAgent", () => {

        it("should return identified agent", () => {

            // given
            agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);

            // when
            const result = agentRegistry.identifyAgent(socketMock);

            // then
            expect(result).toStrictEqual(agentLocalhostDocker);
        });

        it("should return undefined for not tracked agent", () => {

            // when
            const result = agentRegistry.identifyAgent(socketMock);

            // then
            expect(result).toBeUndefined();
        });
    });

    describe("Test scenarios for #getFirstAvailable", () => {

        it("should return available agent", () => {

            // given
            agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);

            // when
            const result = agentRegistry.getFirstAvailable(deployment);

            // then
            expect(result).toStrictEqual({
                ... agentLocalhostDocker,
                socket: socketMock
            });
        });

        it("should throw error if no eligible agent is found", () => {

            // given
            agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);

            // when
            const failingCall = () => agentRegistry.getFirstAvailable(deploymentWithoutAgent);

            // then
            // expected error
            expect(failingCall).toThrow("No eligible agent has connected yet");
        });

        it("should throw error if eligible agent is disconnected", () => {

            // given
            agentRegistry.trackAgent(announcementSocketMessage.payload, socketMock);
            agentRegistry.markAgentDisconnected(socketMock);

            // when
            const failingCall = () => agentRegistry.getFirstAvailable(deployment);

            // then
            // expected error
            expect(failingCall).toThrow("No eligible agent has connected yet");
        });
    });
});
