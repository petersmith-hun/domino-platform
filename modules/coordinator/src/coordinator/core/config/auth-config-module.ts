import { ConfigurationModule } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";

type AuthConfigKey =
    "auth-mode"
    | "expiration"
    | "jwt-private-key"
    | "username"
    | "password"
    | "oauth-issuer"
    | "oauth-audience";

/**
 * Enum constants for the supported authorization modes.
 */
export enum AuthMode {

    DIRECT = "direct",
    OAUTH = "oauth"
}

/**
 * Authorization config parameters.
 */
export interface AuthConfig {

    authMode: AuthMode;
    expiration: number | string;
    jwtPrivateKey: string;
    username: string;
    password: string;
    oAuthIssuer: string;
    oAuthAudience: string;
}

/**
 * ConfigurationModule implementation for initializing the authorization configuration.
 */
export class AuthConfigModule extends ConfigurationModule<AuthConfig, AuthConfigKey> {

    private readonly logger = LoggerFactory.getLogger(AuthConfigModule);

    constructor() {
        super("auth", mapNode => {
            return {
                authMode: super.getValue(mapNode, "auth-mode"),
                expiration: super.getValue(mapNode, "expiration"),
                jwtPrivateKey: super.getValue(mapNode, "jwt-private-key"),
                username: super.getValue(mapNode, "username"),
                password: super.getValue(mapNode, "password"),
                oAuthAudience: super.getValue(mapNode, "oauth-audience"),
                oAuthIssuer: super.getValue(mapNode, "oauth-issuer")
            }
        });
        super.init();

        this.logger.info(`Security has been instantiated in ${this.getConfiguration().authMode} authorization mode`);
    }
}

export const authConfigModule = new AuthConfigModule();
