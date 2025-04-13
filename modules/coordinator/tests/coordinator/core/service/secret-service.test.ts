import { SecretDAO } from "@coordinator/core/dao/secret-dao";
import {
    ConflictingSecretError,
    MissingSecretError,
    NonRetrievableSecretError
} from "@coordinator/core/error/error-types";
import { SecretService } from "@coordinator/core/service/secret-service";
import {
    prepareGroup,
    prepareMetadataResponse,
    secret1,
    secret2,
    secret3,
    secretNew,
    secretNewCreation
} from "@testdata/core";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for SecretService", () => {
    
    let secretDAOMock: SinonStubbedInstance<SecretDAO>;
    let secretService: SecretService;
    
    beforeEach(() => {
        secretDAOMock = sinon.createStubInstance(SecretDAO);
        secretService = new SecretService(secretDAOMock);
    });

    describe("Test scenarios for #retrieveSecretMetadata", () => {

        it("should retrieve metadata of requested secret", async () => {

            // given
            secretDAOMock.findOne.withArgs(secret1.key).resolves(secret1);
            const expectedResult = prepareMetadataResponse(secret1);

            // when
            const result = await secretService.retrieveSecretMetadata(secret1.key);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should throw error on missing requested secret", async () => {

            // given
            secretDAOMock.findOne.withArgs(secret1.key).resolves(null);

            // when
            const failingCall = async () => await secretService.retrieveSecretMetadata(secret1.key);

            // then
            await expect(failingCall).rejects.toThrow(MissingSecretError);
        });
    });

    describe("Test scenarios for #retrieveAllSecretMetadata", () => {

        it("should retrieve metadata of all existing secrets grouped by context", async () => {

            // given
            secretDAOMock.findAll.resolves([secret1, secret2, secret3]);

            const expectedResult = [
                prepareGroup("context1", secret1, secret2),
                prepareGroup("context2", secret3)
            ]

            // when
            const result = await secretService.retrieveAllSecretMetadata();

            // then
            expect(result).toStrictEqual(expectedResult);
        });
    });

    describe("Test scenarios for #retrieveSecret", () => {

        it("should retrieve requested retrievable secret and update last access", async () => {

            // given
            const accessedBy = "user1";

            secretDAOMock.findOne.withArgs(secret2.key).resolves(secret2);

            // when
            const result = await secretService.retrieveSecret(secret2.key, accessedBy);

            // then
            expect(result).toStrictEqual({
                [secret2.key]: secret2.value,
            });

            sinon.assert.calledWith(secretDAOMock.updateLastAccess, secret2, accessedBy);
        });

        it("should throw error for requested non-retrievable secret", async () => {

            // given
            secretDAOMock.findOne.withArgs(secret1.key).resolves(secret1);

            // when
            const failingCall = async () => await secretService.retrieveSecret(secret1.key, "user2");

            // then
            await expect(failingCall).rejects.toThrow(NonRetrievableSecretError);
        });

        it("should throw error for requested non-existing secret", async () => {

            // given
            secretDAOMock.findOne.withArgs(secret1.key).resolves(null);

            // when
            const failingCall = async () => await secretService.retrieveSecret(secret1.key, "user2");

            // then
            await expect(failingCall).rejects.toThrow(MissingSecretError);
        });
    });

    describe("Test scenarios for #retrieveSecretsByContext", () => {

        it("should return all secrets under given context when they are all retrievable and update last access", async () => {

            // given
            const context = "context2";
            const accessedBy = "user1";

            secretDAOMock.findAllByContext.withArgs(context).resolves([secret3, secretNew]);

            // when
            const result = await secretService.retrieveSecretsByContext(context, accessedBy);

            // then
            expect(result).toStrictEqual({
                [secret3.key]: secret3.value,
                [secretNew.key]: secretNew.value
            });

            sinon.assert.calledWith(secretDAOMock.updateLastAccess, secret3, accessedBy);
            sinon.assert.calledWith(secretDAOMock.updateLastAccess, secretNew, accessedBy);
        });

        it("should throw error if any secret under context is non-retrievable", async () => {

            // given
            const context = "context1";

            secretDAOMock.findAllByContext.withArgs(context).resolves([secret1, secret2]);

            // when
            const failingCall = async () => await secretService.retrieveSecretsByContext(context, "user2");

            // then
            await expect(failingCall).rejects.toThrow(NonRetrievableSecretError);
        });

        it("should return empty object if there's no secret under given context", async () => {

            // given
            const context = "context3";
            const accessedBy = "user1";

            secretDAOMock.findAllByContext.withArgs(context).resolves([]);

            // when
            const result = await secretService.retrieveSecretsByContext(context, accessedBy);

            // then
            expect(result).toStrictEqual({});
        });
    });

    describe("Test scenarios for #createSecret", () => {

        it("should create secret with non-conflicting key", async () => {

            // given
            secretDAOMock.findOne.withArgs(secretNewCreation.key).resolves(null);

            // when
            await secretService.createSecret(secretNewCreation);

            // then
            sinon.assert.calledWith(secretDAOMock.save, secretNewCreation);
        });

        it("should throw error on conflicting key", async () => {

            // given
            secretDAOMock.findOne.withArgs(secretNewCreation.key).resolves(secretNew);

            // when
            const failingCall = async () => await secretService.createSecret(secretNewCreation);

            // then
            await expect(failingCall).rejects.toThrow(ConflictingSecretError);
        });
    });

    describe("Test scenarios for #changeRetrievalFlag", () => {

        it("should disable retrieval of given secret and update access", async () => {

            // given
            const accessedBy = "user1";

            secretDAOMock.findOne.withArgs(secret2.key).resolves(secret2);

            // when
            await secretService.changeRetrievalFlag(secret2.key, accessedBy, false);

            // then
            sinon.assert.calledWith(secretDAOMock.updateRetrievable, secret2, false);
            sinon.assert.calledWith(secretDAOMock.updateLastAccess, secret2, accessedBy);
        });

        it("should enable retrieval of given secret and update access", async () => {

            // given
            const accessedBy = "user1";

            secretDAOMock.findOne.withArgs(secret1.key).resolves(secret1);

            // when
            await secretService.changeRetrievalFlag(secret1.key, accessedBy, true);

            // then
            sinon.assert.calledWith(secretDAOMock.updateRetrievable, secret1, true);
            sinon.assert.calledWith(secretDAOMock.updateLastAccess, secret1, accessedBy);
        });

        it("should throw error for requested non-existing secret", async () => {

            // given
            const accessedBy = "user1";

            secretDAOMock.findOne.withArgs(secret1.key).resolves(null);

            // when
            const failingCall = async () => await secretService.changeRetrievalFlag(secret1.key, accessedBy, true);

            // then
            await expect(failingCall).rejects.toThrow(MissingSecretError);
        });
    });

    describe("Test scenarios for #deleteSecret", () => {

        it("should delete secret", async () => {

            // when
            await secretService.deleteSecret(secret1.key);

            // then
            sinon.assert.calledWith(secretDAOMock.delete, secret1.key);
        });
    });
});
