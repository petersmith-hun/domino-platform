import { spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { spawnControlConfig } from "@testdata";

describe("Unit tests for SpawnControlConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration defined in test.yml", () => {

            // when
            const result = spawnControlConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual(spawnControlConfig);
        });
    });
});
