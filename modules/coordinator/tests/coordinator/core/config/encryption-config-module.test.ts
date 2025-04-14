import { EncryptionConfig, encryptionConfigModule } from "@coordinator/core/config/encryption-config-module";
import { KeyObject } from "crypto";

describe("Unit tests for EncryptionConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should resolve and return the encryption key pair provided in test.yml", () => {

            // when
            const result = encryptionConfigModule.getConfiguration() as (EncryptionConfig & { enabled: true });

            // then
            expect(result.privateKey).toBeInstanceOf(KeyObject);
            expect(result.privateKey.type).toBe("private");
            expect(result.publicKey).toBeInstanceOf(KeyObject);
            expect(result.publicKey.type).toBe("public");
        });
    });
});
