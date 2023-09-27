import { agentConfigModule } from "@coordinator/core/config/agent-config-module";
import { agentLocalhostDocker, agentRemoteFilesystem } from "@testdata/core";

describe("Unit tests for AgentConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration defined in test.yml", () => {

            // when
            const result = agentConfigModule.getConfiguration();

            // then
            expect(result.operationTimeout).toBe(90_000);
            expect(result.apiKey).toBe("$2b$12$xo1HO6dr67ZrnxvqaADVo.eww0KxqkYIQdInxF.3VTprSOqLQoX7S");
            expect(result.knownAgents.length).toBe(2);
            expect(result.knownAgents).toContainEqual(agentLocalhostDocker);
            expect(result.knownAgents).toContainEqual(agentRemoteFilesystem)
            expect(result.knownAgents[0].agentID).toBe("domino-agent://localhost/docker/2ce1fba7-aedb-42b5-9033-f9fdd067bba5");
            expect(result.knownAgents[1].agentID).toBe("domino-agent://remote/filesystem/05a66ac8-adeb-4d96-a108-f78ed80723a8");
        });
    });
});
