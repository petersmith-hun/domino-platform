import { ConfigurationModule, MapNode } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";
import { KeyObject } from "crypto";
import * as crypto from "node:crypto";
import * as fs from "node:fs";

type EncryptionConfigKey = "enabled" | "private-key-path" | "public-key-path";

interface EncryptionConfigAttributes {

    publicKey: KeyObject;
    privateKey: KeyObject;
}

type EnabledEncryption = { enabled: true };
type DisabledEncryption = { enabled: false };

/**
 * Encryption configuration parameters.
 */
export type EncryptionConfig = (EncryptionConfigAttributes & EnabledEncryption) | DisabledEncryption;

/**
 * ConfigurationModule implementation for initializing the encryption configuration, including reading the private and public encryption keys into memory.
 */
export class EncryptionConfigModule extends ConfigurationModule<EncryptionConfig, EncryptionConfigKey> {

    constructor() {
        super("encryption", mapNode => {

            if (!this.getValue(mapNode, "enabled", false)) {
                this.logger?.warn("Encryption is disabled, secret manager will store secrets in plain text!");
                return { enabled: false };
            }

            return {
                enabled: true,
                privateKey: this.parseKey(mapNode, "private-key-path", crypto.createPrivateKey),
                publicKey: this.parseKey(mapNode, "public-key-path", crypto.createPublicKey),
            }
        }, LoggerFactory.getLogger(EncryptionConfigModule));
        super.init();
    }

    private parseKey(mapNode: MapNode, pathKey: EncryptionConfigKey, parserFunction: (buffer: Buffer<ArrayBufferLike>) => KeyObject): KeyObject {

        const path: string = super.getMandatoryValue(mapNode, pathKey);
        const keyContents = fs.readFileSync(path);

        return parserFunction(keyContents);
    }
}

export const encryptionConfigModule = new EncryptionConfigModule();
