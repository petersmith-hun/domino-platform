import { AuthConfig, authConfigModule } from "@coordinator/core/config/auth-config-module";
import { DirectAuthError } from "@coordinator/core/error/error-types";
import { DirectAuthRequest } from "@coordinator/web/model/authentication";
import LoggerFactory from "@core-lib/platform/logging";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

type AccessToken = { service: string };

/**
 * Utility class for handling JWT tokens.
 */
export class JWTUtility {

    private static readonly BEARER_TOKEN_MATCHER = /^Bearer (.+)$/;
    private static readonly JWT_ISSUER = "domino";

    private readonly logger = LoggerFactory.getLogger(JWTUtility);

    private readonly authConfig: AuthConfig;

    constructor(authConfig: AuthConfig) {
        this.authConfig = authConfig;
    }

    /**
     * Authenticates a token claim request and creates the token in case of success.
     *
     * @param directAuthRequest object containing a username and a password
     * @returns created JWT token
     * @throws AuthenticationError in case of the failed authenticated
     */
    createToken(directAuthRequest: DirectAuthRequest): string {

        if (!this.authenticate(directAuthRequest)) {
            this.logger.error("Authentication failure - invalid credentials, rejecting token creation");
            throw new DirectAuthError("Authentication failure - invalid claim");
        }

        this.logger.info(`Service ${directAuthRequest.username} successfully authenticated - generating token.`);

        return jwt.sign({ service: directAuthRequest.username }, this.authConfig.jwtPrivateKey, {
            expiresIn: this.authConfig.expiration,
            issuer: JWTUtility.JWT_ISSUER
        });
    }

    /**
     * Verifies the received token.
     * Authorization header must be passed for verification; also it must contain the token as 'Bearer'.
     *
     * @param authorization Authorization header parameter
     * @throws AuthenticationError in case of token verification failure
     */
    verifyToken(authorization: string): void {

        let decodedToken: AccessToken;
        try {
            const token = this.extractToken(authorization);
            decodedToken = jwt.verify(token, this.authConfig.jwtPrivateKey) as AccessToken;
        } catch (error) {
            this.logger.error("Token verification failed: ", error);
            throw new DirectAuthError("Authentication failure - token verification failed");
        }

        if (decodedToken.service !== this.authConfig.username) {
            this.logger.error(`Unknown service user=${decodedToken.service} - token validation failed`);
            throw new DirectAuthError("Authentication failure - token validation failed");
        }
    }

    private authenticate(jwtAuthRequest: DirectAuthRequest): boolean {
        return jwtAuthRequest.username === this.authConfig.username
            && bcrypt.compareSync(jwtAuthRequest.password, this.authConfig.password);
    }

    private extractToken(authorization: string): string {
        return authorization.match(JWTUtility.BEARER_TOKEN_MATCHER)?.[1] ?? "";
    }
}

export const jwtUtility = new JWTUtility(authConfigModule.getConfiguration());
