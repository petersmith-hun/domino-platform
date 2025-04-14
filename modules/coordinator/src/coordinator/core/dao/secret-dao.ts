import { Secret, SecretCreationAttributes } from "@coordinator/core/domain/storage";

/**
 * DAO implementation for managing secrets.
 * Current implementation uses an SQLite database, accessed via Sequelize.
 */
export class SecretDAO {

    /**
     * Returns the secret identified by the given secret, if exists. Otherwise, returns null.
     *
     * @param key key of the secret to be returned
     */
    public async findOne(key: string): Promise<Secret | null> {
        return Secret.findByPk(key);
    }

    /**
     * Returns all existing secrets.
     */
    public async findAll(): Promise<Secret[]> {
        return Secret.findAll();
    }

    /**
     * Returns existing secrets by the given context value.
     *
     * @param context context value to return secrets by
     */
    public async findAllByContext(context: string): Promise<Secret[]> {

        return Secret.findAll({
            where: { context }
        });
    }

    /**
     * Saves the given secret data, adding the default values where applicable.
     *
     * @param secret contents of the secret
     */
    public async save(secret: SecretCreationAttributes): Promise<void> {
        await Secret.upsert(secret);
    }

    /**
     * Updates the "retrievable" flag of the given secret to the given target value.
     *
     * @param secret secret instance to update
     * @param retrievable target retrievable flag status
     */
    public async updateRetrievable(secret: Secret, retrievable: boolean): Promise<void> {

        secret.set("retrievable", retrievable);
        await secret.save();
    }

    /**
     * Updates the "last_accessed_by" field of the given secret to the given target value, and the "last_accessed_at"
     * field to the current date.
     *
     * @param secret secret instance to update
     * @param accessedBy
     */
    public async updateLastAccess(secret: Secret, accessedBy: string): Promise<void> {

        secret.set("lastAccessedAt", new Date());
        secret.set("lastAccessedBy", accessedBy);
        await secret.save();
    }

    /**
     * Deletes the given secret. Immediately (silently) returns if it does not exist.
     *
     * @param key key of the secret to delete
     */
    public async delete(key: string): Promise<void> {

        const secret = await this.findOne(key);
        if (!secret) {
            return;
        }

        await secret.destroy();
    }
}

export const secretDAO: SecretDAO = new SecretDAO();
