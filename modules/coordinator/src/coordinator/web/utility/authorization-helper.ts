import { AuthConfig, authConfigModule, AuthMode } from "@coordinator/core/config/auth-config-module";
import { Scope } from "@coordinator/web/model/common";
import { jwtUtility, JWTUtility } from "@coordinator/web/utility/jwt-utility";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";

/**
 * Utility for preparing the proper authorization middleware for a given controller registration.
 */
export class AuthorizationHelper {

    private readonly authConfig: AuthConfig;
    private readonly jwtUtility: JWTUtility;

    constructor(authConfig: AuthConfig, jwtUtility: JWTUtility) {
        this.authConfig = authConfig;
        this.jwtUtility = jwtUtility;
    }

    /**
     * Returns a (list of) authorization middleware(s) according to the currently configured authorization mode.
     * In OAuth mode, it enables checking the audience and issuer of the received JWT token, as well as sets up the
     * required scope for the endpoint call. In direct mode, it enables verifying the given JWT access token.
     */
    public prepareAuth(): (scope: Scope) => RequestHandler[] {

        return this.authConfig.authMode == AuthMode.OAUTH
            ? this.prepareOAuthAuthorization()
            : this.prepareDirectAuthorization();
    }

    private prepareOAuthAuthorization() {

        return (scope: Scope) => [
            auth({
                issuerBaseURL: this.authConfig.oAuthIssuer,
                audience: this.authConfig.oAuthAudience
            }),
            requiredScopes(scope)
        ];
    }

    private prepareDirectAuthorization() {

        return () => [
            (req: Request, res: Response, next: NextFunction) => {
                const authorizationHeader = req.headers["authorization"] ?? "";
                this.jwtUtility.verifyToken(authorizationHeader);
                next();
            }
        ];
    }
}

export const authorizationHelper = new AuthorizationHelper(authConfigModule.getConfiguration(), jwtUtility);
