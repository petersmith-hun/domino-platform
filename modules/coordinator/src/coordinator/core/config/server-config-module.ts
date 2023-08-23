import { ConfigurationModule } from "@core-lib/platform/config";

type ServerConfigKey = "context-path" | "host" | "port";

/**
 * Express server configuration parameters.
 */
export interface ServerConfig {

    contextPath: string;
    host: string;
    port: number;
}

/**
 * ConfigurationModule implementation for initializing the Express server configuration.
 */
export class ServerConfigModule extends ConfigurationModule<ServerConfig, ServerConfigKey> {

    constructor() {
        super("server", mapNode => {
            return {
                contextPath: super.getValue(mapNode, "context-path", "/"),
                host: super.getValue(mapNode, "host", "127.0.0.1"),
                port: super.getValue(mapNode, "port", 9987)
            }
        });
        super.init();
    }
}

export const serverConfigModule = new ServerConfigModule();
