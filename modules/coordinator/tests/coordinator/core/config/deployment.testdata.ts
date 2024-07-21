import {
    Deployment,
    DockerExecutionType,
    FilesystemExecutionType,
    SourceType
} from "@core-lib/platform/api/deployment";

export const dockerNoArgsDeployment: Deployment = {
    id: "docker-no-args",
    source: {
        type: SourceType.DOCKER,
        home: "localhost:9999/apps1",
        resource: "docker-app-no-args"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "app_docker_no_args",
        via: DockerExecutionType.STANDARD,
        asUser: undefined,
        runtime: undefined,
        args: {
            commandArgs: undefined,
            environment: {},
            networkMode: undefined,
            ports: {},
            restartPolicy: undefined,
            volumes: {},
            custom: undefined
        }
    },
    healthcheck: {
        enabled: false
    },
    info: {
        enabled: false
    }
};

export const dockerAllArgsDeployment: Deployment = {
    id: "docker-all-args",
    source: {
        type: SourceType.DOCKER,
        home: "localhost:9999/apps2",
        resource: "docker-app-all-args"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "app_docker_all_args",
        via: DockerExecutionType.STANDARD,
        asUser: undefined,
        runtime: undefined,
        args: {
            commandArgs: [
                "arg1",
                "arg2"
            ],
            environment: {
                "APP_ARGS": "--spring.profiles.active=test --spring.config.location=/opt/app.yml",
                "ENV": "test"
            },
            networkMode: "host",
            ports: {
                "9998": "7998"
            },
            restartPolicy: "unless-stopped",
            volumes: {
                "/apps/data": "/data:rw",
                "/etc/timezone": "/etc/timezone:ro",
                "/etc/localtime": "/etc/localtime:ro"
            },
            custom: undefined
        }
    },
    healthcheck: {
        enabled: true,
        delay: 20_000,
        timeout: 2_000,
        maxAttempts: 3,
        endpoint: "http://127.0.0.1:9998/health"
    },
    info: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/info",
        fieldMapping: new Map<string, string>([
            ["abbreviation", "$.app.abbreviation"],
            ["version", "$.build.version"]
        ])
    }
};

export const dockerCustomDeployment: Deployment = {
    id: "docker-custom",
    source: {
        type: SourceType.DOCKER,
        home: "localhost:9999/apps3",
        resource: "docker-app-custom"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "app_docker_custom",
        via: DockerExecutionType.STANDARD,
        asUser: undefined,
        runtime: undefined,
        args: {
            commandArgs: undefined,
            environment: {},
            networkMode: undefined,
            ports: {},
            restartPolicy: undefined,
            volumes: {},
            custom: { Image: "app1" }
        }
    },
    healthcheck: {
        enabled: false
    },
    info: {
        enabled: false
    }
};

export const filesystemServiceDeployment: Deployment = {
    id: "fs-service",
    source: {
        type: SourceType.FILESYSTEM,
        home: "http://localhost/release/leaflet-backend1-{version}.jar",
        resource: "leaflet-backend1.jar"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "leaflet-backend1",
        via: FilesystemExecutionType.SERVICE,
        asUser: undefined,
        runtime: undefined,
        args: undefined
    },
    healthcheck: {
        enabled: true,
        delay: 10_000,
        timeout: 1_000,
        maxAttempts: 4,
        endpoint: "http://127.0.0.1:9998/health"
    },
    info: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/info",
        fieldMapping: new Map<string, string>([
            ["abbreviation", "$.app.abbreviation"],
            ["version", "$.build.version"]
        ])
    }
};

export const filesystemExecutableDeployment: Deployment = {
    id: "fs-executable",
    source: {
        type: SourceType.FILESYSTEM,
        home: "http://localhost/release/leaflet-backend2-{version}.jar",
        resource: "leaflet-backend2.jar"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "leaflet-backend2",
        via: FilesystemExecutionType.EXECUTABLE,
        asUser: "appuser",
        runtime: undefined,
        args: [
            "arg1",
            "arg2"
        ]
    },
    healthcheck: {
        enabled: false
    },
    info: {
        enabled: false
    }
};

export const filesystemRuntimeDeployment: Deployment = {
    id: "fs-runtime",
    source: {
        type: SourceType.FILESYSTEM,
        home: "http://localhost/release/leaflet-backend3-{version}.jar",
        resource: "leaflet-backend3.jar"
    },
    target: {
        hosts: [
            "localhost"
        ]
    },
    execution: {
        commandName: "leaflet-backend3",
        via: FilesystemExecutionType.RUNTIME,
        asUser: "appuser",
        runtime: "java",
        args: undefined
    },
    healthcheck: {
        enabled: false
    },
    info: {
        enabled: false
    }
};
