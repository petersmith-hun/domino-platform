import { AppInfoConfig } from "@coordinator/core/config/app-info-config-module";
import { DeploymentStatus } from "@coordinator/core/domain";
import { InfoResponse } from "@coordinator/web/model/actuator";
import { DirectAuthRequest, DirectAuthResponse } from "@coordinator/web/model/authentication";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { Request } from "express";

export const lifecycleRequest: LifecycleRequest = {
    deployment: "domino",
    callStartTime: BigInt(1234)
}

export const versionedLifecycleRequest: VersionedLifecycleRequest = {
    deployment: "domino",
    callStartTime: BigInt(1234),
    version: "1.2.3"
}

export const lifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.DEPLOYED,
    message: "Processed"
}

export const appInfoConfig: AppInfoConfig = {
    applicationName: "Domino Coordinator TEST",
    abbreviation: "DCP-TEST",
    version: "1.0.0-test",
    buildTime: "2023-08-19"
}

export const infoResponse = new InfoResponse(appInfoConfig.applicationName,
    appInfoConfig.abbreviation, appInfoConfig.version, appInfoConfig.buildTime);

export const directAuthRequest = new DirectAuthRequest({
    body: {
        username: "user-1",
        password: "pass-1"
    }
} as unknown as Request)

export const directAuthRequestInvalid = new DirectAuthRequest({} as unknown as Request)

export const directAuthResponse: DirectAuthResponse = {
    jwt: "jwt-token-1"
}