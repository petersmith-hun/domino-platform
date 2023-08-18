/**
 * Info actuator endpoint response model.
 */
export class InfoResponse {

    readonly app: AppInfo;
    readonly build: BuildInfo;

    constructor(appName: string, abbreviation: string, version: string, buildTime: string) {
        this.app = new AppInfo(appName, abbreviation);
        this.build = new BuildInfo(version, buildTime);
    }
}

/**
 * Application related info actuator endpoint response parameters.
 */
class AppInfo {

    readonly name: string;
    readonly abbreviation: string;

    constructor(name: string, abbreviation: string) {
        this.name = name;
        this.abbreviation = abbreviation;
    }
}

/**
 * Build related info actuator endpoint response parameters.
 */
class BuildInfo {

    readonly version: string;
    readonly time: string;

    constructor(version: string, buildTime: string) {
        this.version = version;
        this.time = buildTime;
    }
}

/**
 * Health actuator endpoint response model.
 */
export class HealthResponse {

    readonly status: string = "UP";
}
