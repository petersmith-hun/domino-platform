import { SecretService } from "@coordinator/core/service/secret-service";
import { ControllerType } from "@coordinator/web/controller/controller";
import { SecretController } from "@coordinator/web/controller/secret-controller";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { HttpStatus } from "@core-lib/platform/api/common";
import { prepareGroup, prepareMetadataResponse, secret1, secret2, secret3, secretNew } from "@testdata/core";
import {
    context2AccessRequest,
    emptyAccessRequest,
    emptyContextRequest,
    invalidContextRequest,
    invalidKeyAccessRequest,
    invalidSecretCreationRequest,
    noUserAccessRequest,
    noUserContextRequest,
    secret1AccessRequest,
    secretCreationRequest
} from "@testdata/web";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for SecretController", () => {

    let secretServiceMock: SinonStubbedInstance<SecretService>;
    let secretController: SecretController;

    beforeEach(() => {
        secretServiceMock = sinon.createStubInstance(SecretService);
        secretController = new SecretController(secretServiceMock);
    });

    describe("Test scenarios for #retrieveSecretMetadata", () => {

        it("should return metadata for valid request", async () => {

            // given
            const response = prepareMetadataResponse(secret1);

            secretServiceMock.retrieveSecretMetadata.withArgs(secret1.key).resolves(response);

            // when
            const result = await secretController.retrieveSecretMetadata(secret1AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content).toStrictEqual(response);
        });

        it("should throw validation error for missing key", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretMetadata(emptyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretMetadata(invalidKeyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretMetadata(noUserAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #retrieveAllSecretMetadata", () => {

        it("should return metadata of all existing secret", async () => {

            // given
            const response = [
                prepareGroup("context2", secret1, secret2),
                prepareGroup("context2", secret3, secretNew)
            ];

            secretServiceMock.retrieveAllSecretMetadata.resolves(response);

            // when
            const result = await secretController.retrieveAllSecretMetadata();

            // then
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content).toStrictEqual(response);
        });
    });

    describe("Test scenarios for #retrieveSecret", () => {

        it("should return requested secret", async () => {

            // given
            const response = {
                [secret1.key]: secret1.value,
            };

            secretServiceMock.retrieveSecret.withArgs(secret1.key).resolves(response);

            // when
            const result = await secretController.retrieveSecret(secret1AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content).toStrictEqual(response);
        });

        it("should throw validation error for missing key", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecret(emptyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecret(invalidKeyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecret(noUserAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #retrieveSecretsByContext", () => {

        it("should return secrets under requested context", async () => {

            // given
            const context = "context2";
            const response = {
                [secret3.key]: secret3.value,
                [secretNew.key]: secretNew.value
            };

            secretServiceMock.retrieveSecretsByContext.withArgs(context).resolves(response);

            // when
            const result = await secretController.retrieveSecretsByContext(context2AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content).toStrictEqual(response);
        });

        it("should throw validation error for missing context", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretsByContext(emptyContextRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretsByContext(invalidContextRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.retrieveSecretsByContext(noUserContextRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #createSecret", () => {

        it("should create new secret", async () => {

            // when
            const result = await secretController.createSecret(secretCreationRequest);

            // then
            expect(result.status).toBe(HttpStatus.CREATED);

            sinon.assert.calledWith(secretServiceMock.createSecret, secretCreationRequest);
        });

        it("should throw validation error for malformed request", async () => {

            // when
            const failingCall = async () => await secretController.createSecret(invalidSecretCreationRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #enableRetrieval", () => {

        it("should enable retrieval of given secret", async () => {

            // when
            const result = await secretController.enableRetrieval(secret1AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.NO_CONTENT);

            sinon.assert.calledWith(secretServiceMock.changeRetrievalFlag, secret1AccessRequest.key, secret1AccessRequest.accessedBy, true);
        });

        it("should throw validation error for missing key", async () => {

            // when
            const failingCall = async () => await secretController.enableRetrieval(emptyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.enableRetrieval(invalidKeyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.enableRetrieval(noUserAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #disableRetrieval", () => {

        it("should disable retrieval of given secret", async () => {

            // when
            const result = await secretController.disableRetrieval(secret1AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.NO_CONTENT);

            sinon.assert.calledWith(secretServiceMock.changeRetrievalFlag, secret1AccessRequest.key, secret1AccessRequest.accessedBy, false);
        });

        it("should throw validation error for missing key", async () => {

            // when
            const failingCall = async () => await secretController.disableRetrieval(emptyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.disableRetrieval(invalidKeyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.disableRetrieval(noUserAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #deleteSecret", () => {

        it("should delete secret", async () => {

            // when
            const result = await secretController.deleteSecret(secret1AccessRequest);

            // then
            expect(result.status).toBe(HttpStatus.NO_CONTENT);

            sinon.assert.calledWith(secretServiceMock.deleteSecret, secret1AccessRequest.key);
        });

        it("should throw validation error for missing key", async () => {

            // when
            const failingCall = async () => await secretController.deleteSecret(emptyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for malformed key", async () => {

            // when
            const failingCall = async () => await secretController.deleteSecret(invalidKeyAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });

        it("should throw validation error for missing user", async () => {

            // when
            const failingCall = async () => await secretController.deleteSecret(noUserAccessRequest);

            // then
            await expect(failingCall).rejects.toThrow(InvalidRequestError);
        });
    });

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.SECRET", () => {

            // when
            const result = secretController.controllerType();

            // then
            expect(result).toBe(ControllerType.SECRET);
        });
    });
});
