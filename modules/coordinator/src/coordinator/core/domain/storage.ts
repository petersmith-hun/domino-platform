import { encryptionHandler } from "@coordinator/core/service/encryption/encryption-handler";
import { Deployment } from "@core-lib/platform/api/deployment";
import * as crypto from "node:crypto";
import { DataTypes, Model, ModelAttributes } from "sequelize";

/**
 * Deployment definition attributes for creation/update operation, excludes the dates of creation and last modification.
 */
export interface DeploymentDefinitionCreationAttributes {
    id: string;
    definition: Deployment;
    locked: boolean;
    checksum?: string;
}

/**
 * Deployment definition attributes, including the dates of creation and last modification.
 */
export interface DeploymentDefinitionAttributes extends DeploymentDefinitionCreationAttributes{
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Sequelize model definition for deployment definitions.
 */
export class DeploymentDefinition extends Model<DeploymentDefinitionAttributes, DeploymentDefinitionCreationAttributes> implements DeploymentDefinitionAttributes {
    declare id: string;
    declare definition: Deployment;
    declare locked: boolean;
    declare checksum: string;
    declare createdAt: Date;
    declare updatedAt: Date;
}

/**
 * Sequelize type definitions of deployment definition model.
 */
export const deploymentDefinitionAttributes: ModelAttributes<DeploymentDefinition, DeploymentDefinitionAttributes> = {

    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    definition: {
        type: DataTypes.STRING,
        get(): Deployment {
            // @ts-ignore
            return JSON.parse(this.getDataValue("definition"));
        },
        set(deployment: Deployment): void {
            const deploymentAsString = JSON.stringify(deployment);
            // @ts-ignore
            this.setDataValue("definition", deploymentAsString);
            this.setDataValue("checksum", checksum(deploymentAsString));
        }
    },
    locked: {
        type: DataTypes.BOOLEAN,
    },
    checksum: {
        type: DataTypes.STRING,
    },
    createdAt: {
        type: DataTypes.DATE,
        field: "created_at"
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at"
    }
}

/**
 * Calculates checksum of the given input string. Can be used to calculate checksum of deployment definitions after
 * converting them to JSON document.
 *
 * @param input input string to calculate checksum of
 */
export const checksum = (input: string): string => {

    return crypto.createHash("sha256")
        .update(input)
        .digest()
        .toString("hex");
}

/**
 * Secret attributes for creation operation, excludes the dates of creation and last modification, as well as the
 * retrievable flag, the last_accessed_by and last_accessed_at fields.
 */
export interface SecretCreationAttributes {
    key: string;
    value: string;
    context: string;
}

/**
 * Secret attributes for retrieval, including all secret fields.
 */
export interface SecretAttributes extends SecretCreationAttributes {
    retrievable: boolean;
    lastAccessedBy?: string | null;
    lastAccessedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Sequelize model definition for secrets.
 */
export class Secret extends Model<SecretAttributes, SecretCreationAttributes> implements SecretAttributes {
    declare key: string;
    declare value: string;
    declare context: string;
    declare retrievable: boolean;
    declare lastAccessedBy: string | null;
    declare lastAccessedAt: Date | null;
    declare createdAt: Date;
    declare updatedAt: Date;
}

/**
 * Sequelize type definitions of secret model. Configures decrypting the secret values on retrieval, and encrypting
 * them on save.
 */
export const secretAttributes: ModelAttributes<Secret, SecretAttributes> = {

    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    context: {
        type: DataTypes.STRING
    },
    value: {
        type: DataTypes.STRING,
        get(): string {
            return encryptionHandler.decrypt(this.getDataValue("value"))
        },
        set(value: string): void {
            this.setDataValue("value", encryptionHandler.encrypt(value));
        }
    },
    retrievable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastAccessedAt: {
        type: DataTypes.DATE,
        field: "last_accessed_at"
    },
    lastAccessedBy: {
        type: DataTypes.STRING,
        field: "last_accessed_by"
    },
    createdAt: {
        type: DataTypes.DATE,
        field: "created_at"
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at"
    }
}
