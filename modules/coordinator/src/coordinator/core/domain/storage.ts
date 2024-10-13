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
    id!: string;
    definition!: Deployment;
    locked!: boolean;
    checksum!: string;
    createdAt!: Date;
    updatedAt!: Date;
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
    },
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
