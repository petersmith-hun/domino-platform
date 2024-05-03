import { runtimeConfigModule } from "@bin-exec-agent/config/runtime-config-module";
import { runtimeConfig } from "@testdata";

describe("Unit tests for RuntimeConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration defined in test.yml", () => {

            // when
            const result = runtimeConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual(runtimeConfig);
        });
    });
});
