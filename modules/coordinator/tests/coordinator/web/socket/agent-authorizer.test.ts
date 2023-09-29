import { agentConfigModule } from "@coordinator/core/config/agent-config-module";
import { AgentAuthorizer } from "@coordinator/web/socket/agent-authorizer";
import { IncomingMessage } from "http";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for AgentAuthorizer", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let agentAuthorizer: AgentAuthorizer;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        agentAuthorizer = new AgentAuthorizer(agentConfigModule.getConfiguration());
    });

    describe("Test scenarios for #authorize", () => {

        it("should authorize successfully", () => {

            // given
            const request = {
                headers: {
                    "x-api-key": "3ff75fa1-2be2-4bf9-8df7-c394148e9a03",
                    "x-agent-id": "test-agent"
                }
            } as unknown as IncomingMessage;

            // when
            const result = agentAuthorizer.authorize(socketMock, request);

            // then
            expect(result).toBe(true);
        });

        it("should authorization fail for invalid API key", () => {

            // given
            const request = {
                headers: {
                    "x-api-key": "invalid-api-key",
                    "x-agent-id": "test-agent"
                }
            } as unknown as IncomingMessage;

            // when
            const result = agentAuthorizer.authorize(socketMock, request);

            // then
            expect(result).toBe(false);
            sinon.assert.called(socketMock.terminate);
        });
    });
});
