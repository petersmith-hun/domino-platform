import { AuthConfig, authConfigModule, AuthMode } from "@coordinator/core/config/auth-config-module";
import { DirectAuthError } from "@coordinator/core/error/error-types";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { DirectAuthRequest, DirectAuthResponse } from "@coordinator/web/model/authentication";
import { ResponseWrapper } from "@coordinator/web/model/common";
import { JWTUtility, jwtUtility } from "@coordinator/web/utility/jwt-utility";
import { Validated } from "@coordinator/web/utility/validator";
import { HttpStatus } from "@core-lib/platform/api/common";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Controller implementation to handle authentication requests.
 */
export class AuthenticationController implements Controller {

    private readonly logger = LoggerFactory.getLogger(AuthenticationController);

    private readonly jwtUtility: JWTUtility;
    private readonly authConfig: AuthConfig;

    constructor(jwtUtility: JWTUtility, authConfig: AuthConfig) {
        this.jwtUtility = jwtUtility;
        this.authConfig = authConfig;

        if (this.authConfig.authMode === AuthMode.OAUTH) {
            this.logger.warn("Claim token endpoint is disabled by currently active authorization mode");
        }
    }

    /**
     * POST /claim-token
     * Claims a JWT token with the credentials provided in request body (as username and password fields).
     *
     * @param directAuthRequest authentication request
     */
    @Validated()
    claimToken(directAuthRequest: DirectAuthRequest): ResponseWrapper<DirectAuthResponse> {

        if (this.authConfig.authMode === AuthMode.OAUTH) {
            throw new DirectAuthError("Unsupported authentication method");
        }

        return new ResponseWrapper<DirectAuthResponse>(HttpStatus.CREATED, {
            jwt: this.jwtUtility.createToken(directAuthRequest)
        });
    }

    controllerType(): ControllerType {
        return ControllerType.AUTHENTICATION;
    }
}

export const authenticationController = new AuthenticationController(jwtUtility, authConfigModule.getConfiguration());
