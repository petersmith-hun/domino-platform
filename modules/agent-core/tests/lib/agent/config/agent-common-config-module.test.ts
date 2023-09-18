import { agentCommonConfigModule } from "@core-lib/agent/config/agent-common-config-module";
import { agentConfig, agentID } from "@testdata";

describe("Unit tests for AgentCommonConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the defined configuration in test.yml", () => {

            // when
            const result = agentCommonConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual(agentConfig);
        });
    });

    describe("Test scenarios for #compactID", () => {

        it("should return the compacted agent ID based on the config", () => {

            // when
            const result = agentCommonConfigModule.compactID;

            // then
            expect(result).toBe(agentID);
        });
    });
});
