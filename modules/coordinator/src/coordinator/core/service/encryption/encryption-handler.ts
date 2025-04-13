import { EncryptionConfig, encryptionConfigModule } from "@coordinator/core/config/encryption-config-module";
import * as crypto from "node:crypto";

/**
 * Encryption handler component. Uses node:crypto module, handling RSA asymmetric keys for encryption/decryption. In
 * order to have "clean", serializable data after encryption, encrypted data is also encoded into Base64 format.
 */
export class EncryptionHandler {

    private readonly encryptionConfig: EncryptionConfig;

    constructor(encryptionConfig: EncryptionConfig) {
        this.encryptionConfig = encryptionConfig;
    }

    /**
     * Encrypts the given string of data.
     *
     * @param decrypted raw string data to be encrypted
     */
    public encrypt(decrypted: string): string {

        if (!this.encryptionConfig.enabled) {
            return decrypted;
        }

        return crypto.publicEncrypt({
            key: this.encryptionConfig.publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        }, Buffer.from(decrypted)).toString("base64")
    }

    /**
     * Decrypts the given encrypted and Base64 encoded data. Returns the decrypted data as string.
     *
     * @param encrypted encrypted and encoded data to be decrypted
     */
    public decrypt(encrypted: string): string {

        if (!this.encryptionConfig.enabled) {
            return encrypted;
        }

        return crypto.privateDecrypt({
            key: this.encryptionConfig.privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        }, Buffer.from(encrypted, "base64")).toString();
    }
}

export const encryptionHandler = new EncryptionHandler(encryptionConfigModule.getConfiguration());
