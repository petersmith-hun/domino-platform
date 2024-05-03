import { storageConfigModule } from "@bin-exec-agent/config/storage-config-module";
import { storageConfig } from "@testdata";

describe("Unit tests for StorageConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration defined in test.yml", () => {

            // when
            const result = storageConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual(storageConfig);
        });
    });
});
