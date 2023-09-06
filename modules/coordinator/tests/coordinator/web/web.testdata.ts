import { AppInfoConfig } from "@coordinator/core/config/app-info-config-module";
import { InfoResponse } from "@coordinator/web/model/actuator";
import { DirectAuthRequest, DirectAuthResponse } from "@coordinator/web/model/authentication";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { Request } from "express";
import { hrtime } from "node:process";
import sinon from "sinon";

const hrTimeStub = sinon.stub(hrtime, "bigint");
hrTimeStub.returns(BigInt(1_234_000_000));

export const lifecycleRequest = new LifecycleRequest({
    params: {
        deployment: "domino"
    }
} as unknown as Request);

export const versionedLifecycleRequest = new VersionedLifecycleRequest({
    params: {
        deployment: "domino",
        version: "1.2.3"
    }
} as unknown as Request);

hrTimeStub.restore();

export const lifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.DEPLOYED,
    message: "Processed"
}

export const startLifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.HEALTH_CHECK_OK,
    message: "Processed in 1000 ms"
}

export const stopLifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.UNKNOWN_STOPPED,
    message: "Processed in 1000 ms"
}

export const deployLifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.DEPLOYED,
    message: `Deployment has finished for version=latest in 1000 ms`,
    version: "latest"
}

export const versionedDeployLifecycleResponse: LifecycleResponse = {
    status: DeploymentStatus.DEPLOYED,
    message: `Deployment has finished for version=1.2.3 in 1000 ms`,
    version: "1.2.3"
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