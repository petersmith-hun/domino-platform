import { RuntimeConfig } from "@bin-exec-agent/config/runtime-config-module";
import { SpawnControlConfig } from "@bin-exec-agent/config/spawn-control-config-module";
import { StorageConfig } from "@bin-exec-agent/config/storage-config-module";
import {
    DeploymentBinaryReference,
    ExecutorUser,
    LifecycleBinaryReference,
    ServiceHandlerType, SpawnParameters
} from "@bin-exec-agent/domain/common";
import { TaskContext } from "@core-lib/agent/service/task";
import { Deployment, FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";

export const spawnControlConfig: SpawnControlConfig = {
    "allowedExecutorUsers": ["leaflet", "domino"],
    "autoUnpack": true,
    "serviceHandler": ServiceHandlerType.SYSTEMD,
    "startDelay": 3000
};

export const spawnControlConfigUnpackDisabled: SpawnControlConfig = {
    ... spawnControlConfig,
    "autoUnpack": false,
};

export const spawnControlConfigInvalidUsers: SpawnControlConfig = {
    "allowedExecutorUsers": ["leaflet$$", "domino#"],
    "autoUnpack": true,
    "serviceHandler": ServiceHandlerType.SYSTEMD,
    "startDelay": 3000
};

export const executorUserLeaflet: ExecutorUser = {
    userID: 1000,
    groupID: 1001
};

export const executorUserDomino: ExecutorUser = {
    userID: 1002,
    groupID: 1003
};

export const runtimeConfig: RuntimeConfig[] = [{
    "binaryPath": "/usr/bin/runtime1",
    "commandLine": "{args} {resource}",
    "healthcheck": "--version",
    "id": "runtime1"
}, {
    "binaryPath": "/usr/bin/runtime2",
    "commandLine": "resource:{resource}",
    "healthcheck": "-v",
    "id": "runtime2"
}];

export const runtimeConfigJava: RuntimeConfig = {
    "binaryPath": "/usr/bin/java",
    "commandLine": "{args} -jar {resource}",
    "healthcheck": "--version",
    "id": "java"
}

export const storageConfig: StorageConfig = {
    "applicationHomePath": "/path/to/application/home",
    "deploymentStorePath": "/path/to/deployment/storage"
};

export const unusedTaskContext = {} as TaskContext;

export const deploymentDomino: Deployment = {
    id: "domino",
    source: {
        home: "http://localhost:9000/domino-{version}.ts",
        resource: "domino.ts"
    },
    execution: {
        via: FilesystemExecutionType.EXECUTABLE,
        asUser: "domino",
        args: "arg1"
    },
} as unknown as Deployment;

export const deploymentDominoMultiArgs: Deployment = {
    id: "domino",
    source: {
        home: "http://localhost:9000/domino-{version}.ts",
        resource: "domino.ts"
    },
    execution: {
        via: FilesystemExecutionType.EXECUTABLE,
        asUser: "domino",
        args: ["arg1", "arg3"]
    }
} as unknown as Deployment;

export const deploymentLeaflet: Deployment = {
    id: "leaflet",
    source: {
        home: "http://localhost:9000/leaflet-{version}.jar",
        resource: "leaflet-exec.jar"
    },
    execution: {
        via: FilesystemExecutionType.RUNTIME,
        asUser: "leaflet",
        args: ["arg1", "arg2"],
        runtime: "java"
    }
} as Deployment;

export const deploymentLeafletSingleArg: Deployment = {
    id: "leaflet",
    source: {
        home: "http://localhost:9000/leaflet-{version}.jar",
        resource: "leaflet-exec.jar"
    },
    execution: {
        via: FilesystemExecutionType.RUNTIME,
        asUser: "leaflet",
        args: "-Xmx1G",
        runtime: "java"
    }
} as unknown as Deployment;

export const deploymentLeafletNoArg: Deployment = {
    id: "leaflet",
    source: {
        home: "http://localhost:9000/leaflet-{version}.jar",
        resource: "leaflet-exec.jar"
    },
    execution: {
        via: FilesystemExecutionType.RUNTIME,
        asUser: "leaflet",
        runtime: "java"
    }
} as unknown as Deployment;

export const deploymentLMS: Deployment = {
    id: "lms",
    source: {
        home: "http://localhost:9000/lms-{version}.zip",
        resource: "lms-exec.jar"
    },
    execution: {
        via: FilesystemExecutionType.SERVICE,
        asUser: "leaflet",
        commandName: "lms-svc"
    }
} as Deployment;

export const deploymentVersionExact: DeploymentVersion = {
    versionType: DeploymentVersionType.EXACT,
    version: "1.2.0"
}

export const deploymentVersionLatest: DeploymentVersion = {
    versionType: DeploymentVersionType.LATEST
}

export const deploymentBinaryReferenceExactVersion: DeploymentBinaryReference = {
    deploymentID: "domino",
    sourcePath: "http://localhost:9000/domino-1.2.0.ts",
    storePath: "/path/to/deployment/storage/executable-domino-v1.2.0.ts",
    workDirectory: "/path/to/application/home/domino",
    applicationPath: "/path/to/application/home/domino/domino.ts"
}

export const deploymentBinaryReferenceLatestVersion: DeploymentBinaryReference = {
    deploymentID: "domino",
    sourcePath: "http://localhost:9000/domino-latest.ts",
    storePath: "/path/to/deployment/storage/executable-domino-vlatest.ts",
    workDirectory: "/path/to/application/home/domino",
    applicationPath: "/path/to/application/home/domino/domino.ts"
}

export const deploymentBinaryReferenceZip: DeploymentBinaryReference = {
    deploymentID: "domino",
    sourcePath: "http://localhost:9000/lms-1.2.0.zip",
    storePath: "/path/to/deployment/storage/executable-lms-v1.2.0.zip",
    workDirectory: "/path/to/application/home/lms",
    applicationPath: "/path/to/application/home/lms/lms-exec.jar"
}

export const deploymentBinaryReferenceInvalidSourcePath: DeploymentBinaryReference = {
    ... deploymentBinaryReferenceZip,
    sourcePath: "/unsupported/local/path/to/lms-1.2.0.zip"
};

export const lifecycleBinaryReferenceDomino: LifecycleBinaryReference = {
    deploymentID: "domino",
    workDirectory: "/path/to/application/home/domino",
    applicationPath: "/path/to/application/home/domino/domino.ts"
}

export const lifecycleBinaryReferenceLeaflet: LifecycleBinaryReference = {
    deploymentID: "leaflet",
    workDirectory: "/path/to/application/home/leaflet",
    applicationPath: "/path/to/application/home/leaflet/leaflet-exec.jar"
}

export const spawnParametersDomino: SpawnParameters = {
    deploymentID: "domino",
    workDirectory: "/path/to/application/home/domino",
    userID: 1002,
    arguments: ["arg1"],
    executablePath: "/path/to/application/home/domino/domino.ts"
}

export const spawnParametersDominoMultiArgs: SpawnParameters = {
    ... spawnParametersDomino,
    arguments: ["arg1", "arg3"]
}

export const spawnParametersLeaflet: SpawnParameters = {
    deploymentID: "leaflet",
    workDirectory: "/path/to/application/home/leaflet",
    userID: 1000,
    arguments: ["arg1", "arg2", "-jar", "leaflet-exec.jar"],
    executablePath: "/usr/bin/java"
}

export const spawnParametersLeafletSingleArg: SpawnParameters = {
    deploymentID: "leaflet",
    workDirectory: "/path/to/application/home/leaflet",
    userID: 1000,
    arguments: ["-Xmx1G", "-jar", "leaflet-exec.jar"],
    executablePath: "/usr/bin/java"
}

export const spawnParametersLeafletNoArg: SpawnParameters = {
    deploymentID: "leaflet",
    workDirectory: "/path/to/application/home/leaflet",
    userID: 1000,
    arguments: ["-jar", "leaflet-exec.jar"],
    executablePath: "/usr/bin/java"
}
