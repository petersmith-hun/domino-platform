import { AppInfoConfig } from "@coordinator/core/config/app-info-config-module";
import { DeploymentSummary } from "@coordinator/core/domain";
import { InfoResponse } from "@coordinator/web/model/actuator";
import { DirectAuthRequest, DirectAuthResponse } from "@coordinator/web/model/authentication";
import { PageRequest, PageResponse } from "@coordinator/web/model/common";
import { LifecycleRequest, LifecycleResponse, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { deploymentSummary } from "@testdata/core";
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

export const pageRequest = new PageRequest({
    query: {
        pageSize: 5,
        pageNumber: 2
    }
} as unknown as Request);

export const pageRequestWithDefaults = new PageRequest({} as unknown as Request);

export const invalidPageRequest = new PageRequest({
    query: {
        pageSize: 3,
        pageNumber: 0
    }
} as unknown as Request);

export const pageResponse: PageResponse<DeploymentSummary> = {
    pagination: {
        pageNumber: 2,
        pageCount: 2,
        entityCount: 6,
        entityCountOnPage: 1,
        hasNext: false,
        hasPrevious: true,
        first: false,
        last: true
    },
    body: [
        deploymentSummary
    ]
}
