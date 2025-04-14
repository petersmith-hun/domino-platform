import { groupedSecretMetadataConverter, secretMetadataConverter } from "@coordinator/core/conversion";
import { secretDAO, SecretDAO } from "@coordinator/core/dao/secret-dao";
import { SecretValueWrapper } from "@coordinator/core/domain";
import { Secret, SecretCreationAttributes } from "@coordinator/core/domain/storage";
import {
    ConflictingSecretError,
    MissingSecretError,
    NonRetrievableSecretError
} from "@coordinator/core/error/error-types";
import { GroupedSecretMetadataResponse, SecretMetadataResponse } from "@coordinator/web/model/secret";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Service implementation to control the internal secret manager.
 */
export class SecretService {

    private readonly logger = LoggerFactory.getLogger(SecretService);

    private readonly secretDAO: SecretDAO;

    constructor(secretDAO: SecretDAO) {
        this.secretDAO = secretDAO;
    }

    /**
     * Returns the meta information of the given secret.
     *
     * @param secretKey key of the secret to return
     * @throws MissingSecretError if the requested secret does not exist
     */
    public async retrieveSecretMetadata(secretKey: string): Promise<SecretMetadataResponse> {

        const secret = await this.retrieveRequiredSecret(secretKey);

        return secretMetadataConverter(secret);
    }

    /**
     * Returns the meta information of all existing secret.
     */
    public async retrieveAllSecretMetadata(): Promise<GroupedSecretMetadataResponse[]> {

        const secrets = await this.secretDAO.findAll();

        return groupedSecretMetadataConverter(secrets);
    }

    /**
     * Returns the given secret. Also triggers recording who the secret was accessed by.
     *
     * @param secretKey key of the secret to return
     * @param accessedBy name of who accessed the secret
     * @throws MissingSecretError if the requested secret does not exist
     * @throws NonRetrievableSecretError if the requested secret is not retrievable
     */
    public async retrieveSecret(secretKey: string, accessedBy: string): Promise<SecretValueWrapper> {

        this.logger.info(`Retrieving secret by key '${secretKey}'`);

        const secret = await this.retrieveRequiredSecret(secretKey);
        await this.secretDAO.updateLastAccess(secret, accessedBy);

        return this.mapToSecretWrapper([secret]);
    }

    /**
     * Retrieves all secret grouped under the given context. Also triggers recording who the secret was accessed by.
     *
     * @param context context of the secrets to return
     * @param accessedBy name of who accessed the secret
     * @throws NonRetrievableSecretError if any of the secrets within the requested context is not retrievable
     */
    public async retrieveSecretsByContext(context: string, accessedBy: string): Promise<SecretValueWrapper> {

        this.logger.info(`Retrieving secret by context '${context}'`);

        const secrets = await this.secretDAO.findAllByContext(context);
        for (const secret of secrets) {
            await this.secretDAO.updateLastAccess(secret, accessedBy);
        }

        return this.mapToSecretWrapper(secrets);
    }

    /**
     * Creates a new secret. Created secrets are non-retrievable by default.
     *
     * @param secret contents of the new secret
     * @throws ConflictingSecretError if a secret already exists under the requested key
     */
    public async createSecret(secret: SecretCreationAttributes): Promise<void> {

        const existingSecret = await this.secretDAO.findOne(secret.key);
        if (existingSecret) {
            this.logger.error(`Secret already exists under key=${secret.key}`);
            throw new ConflictingSecretError(secret.key);
        }

        await this.secretDAO.save(secret);

        this.logger.info(`Created secret '${secret.key}'`);
    }

    /**
     * Enables or disables retrieval of the given secret.
     *
     * @param secretKey key of the secret to enable/disable
     * @param accessedBy name of who accessed the secret
     * @param retrievable target retrievable flag status
     * @throws MissingSecretError if the requested secret does not exist
     */
    public async changeRetrievalFlag(secretKey: string, accessedBy: string, retrievable: boolean): Promise<void> {

        const secret = await this.retrieveRequiredSecret(secretKey);
        await this.secretDAO.updateRetrievable(secret, retrievable);
        await this.secretDAO.updateLastAccess(secret, accessedBy);

        this.logger.info(`${retrievable ? "Enabled" : "Disabled"} retrieval of secret '${secretKey}'`);
    }

    /**
     * Deletes the given secret.
     *
     * @param secretKey key of the secret to delete
     */
    public async deleteSecret(secretKey: string): Promise<void> {

        await this.secretDAO.delete(secretKey);

        this.logger.info(`Deleted secret '${secretKey}'`);
    }

    private async retrieveRequiredSecret(secretKey: string): Promise<Secret> {

        const secret = await this.secretDAO.findOne(secretKey);

        if (!secret) {
            this.logger.error(`Requested non-existing secret by key=${secretKey}`);
            throw new MissingSecretError(secretKey);
        }

        return secret;
    }

    private mapToSecretWrapper(secrets: Secret[]): SecretValueWrapper {

        secrets.forEach(secret => this.assertRetrievableSecret(secret));

        const wrapper: SecretValueWrapper = {};
        secrets.forEach(secret => wrapper[secret.key] = secret.value);

        return wrapper;
    }

    private assertRetrievableSecret(secret: Secret) {

        if (!secret.retrievable) {
            this.logger.error(`Requested non-retrievable secret by key=${secret.key}`);
            throw new NonRetrievableSecretError(secret.key);
        }
    }
}

export const secretService = new SecretService(secretDAO);
