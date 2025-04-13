import { SecretValueWrapper } from "@coordinator/core/domain";
import { secretService, SecretService } from "@coordinator/core/service/secret-service";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { ResponseWrapper } from "@coordinator/web/model/common";
import {
    ContextAccessRequest,
    GroupedSecretMetadataResponse,
    SecretAccessRequest,
    SecretCreationRequest,
    SecretMetadataResponse
} from "@coordinator/web/model/secret";
import { Validated } from "@coordinator/web/utility/validator";
import { HttpStatus } from "@core-lib/platform/api/common";

/**
 * Controller implementation to control the internal secret manager.
 */
export class SecretController implements Controller {

    private readonly secretService: SecretService;

    constructor(secretService: SecretService) {
        this.secretService = secretService;
    }

    /**
     * GET /secrets/:key/metadata
     * Retrieves the meta information of the given secret.
     *
     * @param request key of the secret to retrieve wrapped as SecretAccessRequest
     */
    @Validated()
    async retrieveSecretMetadata(request: SecretAccessRequest): Promise<ResponseWrapper<SecretMetadataResponse>> {
        return new ResponseWrapper(HttpStatus.OK, await this.secretService.retrieveSecretMetadata(request.key));
    }

    /**
     * GET /secrets
     * Retrieves the meta information of all existing secret. Secrets in the response are grouped by their context value.
     */
    async retrieveAllSecretMetadata(): Promise<ResponseWrapper<GroupedSecretMetadataResponse[]>> {
        return new ResponseWrapper(HttpStatus.OK, await this.secretService.retrieveAllSecretMetadata());
    }

    /**
     * GET /secrets/:key
     * Retrieves the given secret. Also triggers recording who the secret was accessed by.
     *
     * @param request key of the secret to retrieve wrapped as SecretAccessRequest
     */
    @Validated()
    async retrieveSecret(request: SecretAccessRequest): Promise<ResponseWrapper<SecretValueWrapper>> {
        return new ResponseWrapper(HttpStatus.OK, await this.secretService.retrieveSecret(request.key, request.accessedBy));
    }

    /**
     * GET /secrets/context/:context
     * Retrieves all secret grouped under the given context. Also triggers recording who the secret was accessed by.
     *
     * @param request context of the secrets to retrieve wrapped as ContextAccessRequest
     */
    @Validated()
    async retrieveSecretsByContext(request: ContextAccessRequest): Promise<ResponseWrapper<SecretValueWrapper>> {
        return new ResponseWrapper(HttpStatus.OK, await this.secretService.retrieveSecretsByContext(request.context, request.accessedBy));
    }

    /**
     * POST /secrets
     * Creates a new secret. Created secrets are non-retrievable by default.
     *
     * @param request contents of the secret to be stored
     */
    @Validated()
    async createSecret(request: SecretCreationRequest): Promise<ResponseWrapper<void>> {

        await this.secretService.createSecret(request);

        return new ResponseWrapper(HttpStatus.CREATED);
    }

    /**
     * PUT /secrets/:key/retrieval
     * Enables retrieval of the given secret.
     *
     * @param request key of the secret to enable retrieval of, wrapped as SecretAccessRequest
     */
    @Validated()
    async enableRetrieval(request: SecretAccessRequest): Promise<ResponseWrapper<void>> {

        await this.secretService.changeRetrievalFlag(request.key, request.accessedBy, true);

        return new ResponseWrapper(HttpStatus.NO_CONTENT);
    }

    /**
     * DELETE /secrets/:key/retrieval
     * Disables retrieval of the given secret.
     *
     * @param request key of the secret to disable retrieval of, wrapped as SecretAccessRequest
     */
    @Validated()
    async disableRetrieval(request: SecretAccessRequest): Promise<ResponseWrapper<void>> {

        await this.secretService.changeRetrievalFlag(request.key, request.accessedBy, false);

        return new ResponseWrapper(HttpStatus.NO_CONTENT);
    }

    /**
     * DELETE /secrets/:key
     * Deletes the given secret.
     *
     * @param request key of the secret to delete, wrapped as SecretAccessRequest
     */
    @Validated()
    async deleteSecret(request: SecretAccessRequest): Promise<ResponseWrapper<void>> {

        await this.secretService.deleteSecret(request.key);

        return new ResponseWrapper(HttpStatus.NO_CONTENT);
    }

    controllerType(): ControllerType {
        return ControllerType.SECRET;
    }
}

export const secretController = new SecretController(secretService);
