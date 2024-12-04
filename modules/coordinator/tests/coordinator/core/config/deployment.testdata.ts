import { checksum, DeploymentDefinition } from "@coordinator/core/domain/storage";
import { ExtendedDeployment } from "@coordinator/web/model/deployment";
import {
    Deployment,
    DockerExecutionType,
    FilesystemExecutionType,
    SourceType
} from "@core-lib/platform/api/deployment";

const wrapAsDefinition = (deployment: Deployment, locked: boolean = true): DeploymentDefinition => {

    return {
        id: deployment.id,
        definition: deployment,
        locked: locked,
        checksum: checksum(JSON.stringify(deployment)),
        createdAt: new Date(),
        updatedAt: new Date()
    } as DeploymentDefinition;
}

const wrapAsExtended = (deploymentDefinition: DeploymentDefinition): ExtendedDeployment => {

    return {
        ...deploymentDefinition.definition,
        metadata: {
            locked: deploymentDefinition.locked,
            createdAt: deploymentDefinition.createdAt,
            updatedAt: deploymentDefinition.updatedAt
        }
    };
}

const removeUndefinedFields = (deployment: Deployment): Deployment => {
    return JSON.parse(JSON.stringify(deployment));
}

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
        via: DockerExecutionType.STANDARD,
        commandName: "app_docker_no_args",
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

export const dockerNoArgsDeploymentYaml = `
domino:
  deployments:
    docker-no-args:
      source:
        type: DOCKER
        home: localhost:9999/apps1
        resource: docker-app-no-args
      target:
        hosts:
          - localhost
      execution:
        command-name: app_docker_no_args
        via: STANDARD
        args: {}
      health-check:
        enabled: false
      info:
        enabled: false
`;

export const dockerNoArgsDeploymentNoUndefinedFields = removeUndefinedFields(dockerNoArgsDeployment);
export const dockerNoArgsDeploymentDefinition: DeploymentDefinition = wrapAsDefinition(dockerNoArgsDeployment);

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
        via: DockerExecutionType.STANDARD,
        commandName: "app_docker_all_args",
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
            ports: {
                "9998": "7998"
            },
            networkMode: "host",
            volumes: {
                "/apps/data": "/data:rw",
                "/etc/timezone": "/etc/timezone:ro",
                "/etc/localtime": "/etc/localtime:ro"
            },
            restartPolicy: "unless-stopped",
            custom: undefined
        }
    },
    healthcheck: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/health",
        delay: 20_000,
        maxAttempts: 3,
        timeout: 2_000
    },
    info: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/info",
        fieldMapping: {
            abbreviation: "$.app.abbreviation",
            version: "$.build.version"
        }
    }
};

export const dockerAllArgsDeploymentYaml = `
domino:
  deployments:
    docker-all-args:
      source:
        type: DOCKER
        home: localhost:9999/apps2
        resource: docker-app-all-args
      target:
        hosts:
          - localhost
      execution:
        command-name: app_docker_all_args
        via: STANDARD
        args:
          ports:
            9998: "7998"
          network-mode: host
          environment:
            APP_ARGS: --spring.profiles.active=test --spring.config.location=/opt/app.yml
            ENV: test
          command-args:
            - arg1
            - arg2
          volumes:
            "/apps/data": "/data:rw"
            "/etc/timezone": "/etc/timezone:ro"
            "/etc/localtime": "/etc/localtime:ro"
          restart-policy: unless-stopped
      health-check:
        enabled: true
        delay: 20 seconds
        timeout: 2 seconds
        max-attempts: 3
        endpoint: http://127.0.0.1:9998/health
      info:
        enabled: true
        endpoint: http://127.0.0.1:9998/info
        field-mapping:
          abbreviation: $.app.abbreviation
          version: $.build.version
`;

export const dockerAllArgsDeploymentNoUndefinedFields = removeUndefinedFields(dockerAllArgsDeployment);
export const dockerAllArgsDeploymentModified = removeUndefinedFields(dockerAllArgsDeployment);
dockerAllArgsDeploymentModified.source.home = "localhost:8888/new-apps";
export const dockerAllArgsDeploymentDefinition: DeploymentDefinition = wrapAsDefinition(dockerAllArgsDeployment);
export const dockerAllArgsDeploymentDefinitionUnlocked: DeploymentDefinition = wrapAsDefinition(dockerAllArgsDeployment, false);
export const extendedDockerAllArgsDeployment: ExtendedDeployment = wrapAsExtended(dockerAllArgsDeploymentDefinition);

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
        via: DockerExecutionType.STANDARD,
        commandName: "app_docker_custom",
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

export const dockerCustomDeploymentYaml = `
domino:
  deployments:
    docker-custom:
      source:
        type: DOCKER
        home: localhost:9999/apps3
        resource: docker-app-custom
      target:
        hosts:
          - localhost
      execution:
        command-name: app_docker_custom
        via: STANDARD
        args:
          custom:
            Image: app1
      health-check:
        enabled: false
      info:
        enabled: false
`;

export const dockerCustomDeploymentNoUndefinedFields = removeUndefinedFields(dockerCustomDeployment);

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
        via: FilesystemExecutionType.SERVICE,
        commandName: "leaflet-backend1",
        asUser: undefined,
        runtime: undefined,
        args: undefined
    },
    healthcheck: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/health",
        delay: 10_000,
        maxAttempts: 4,
        timeout: 1_000
    },
    info: {
        enabled: true,
        endpoint: "http://127.0.0.1:9998/info",
        fieldMapping: {
            abbreviation: "$.app.abbreviation",
            version: "$.build.version"
        }
    }
};

export const filesystemServiceDeploymentYaml = `
domino:
  deployments:
    fs-service:
      source:
        type: FILESYSTEM
        home: http://localhost/release/leaflet-backend1-{version}.jar
        resource: leaflet-backend1.jar
      target:
        hosts:
          - localhost
      execution:
        via: SERVICE
        command-name: leaflet-backend1
      health-check:
        enabled: true
        delay: 10 seconds
        timeout: 1 seconds
        max-attempts: 4
        endpoint: http://127.0.0.1:9998/health
      info:
        enabled: true
        endpoint: http://127.0.0.1:9998/info
        field-mapping:
          abbreviation: $.app.abbreviation
          version: $.build.version
`;

export const filesystemServiceDeploymentNoUndefinedFields = removeUndefinedFields(filesystemServiceDeployment);

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
        via: FilesystemExecutionType.EXECUTABLE,
        commandName: "leaflet-backend2",
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

export const filesystemExecutableDeploymentYaml = `
domino:
  deployments:
    fs-executable:
      source:
        type: FILESYSTEM
        home: http://localhost/release/leaflet-backend2-{version}.jar
        resource: leaflet-backend2.jar
      target:
        hosts:
          - localhost
      execution:
        via: EXECUTABLE
        as-user: appuser
        command-name: leaflet-backend2
        args:
          - arg1
          - arg2
      health-check:
        enabled: false
      info:
        enabled: false
`;

export const filesystemExecutableDeploymentNoUndefinedFields = removeUndefinedFields(filesystemExecutableDeployment);

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
        via: FilesystemExecutionType.RUNTIME,
        commandName: "leaflet-backend3",
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

export const filesystemRuntimeDeploymentYaml = `
domino:
  deployments:
    fs-runtime:
      source:
        type: FILESYSTEM
        home: http://localhost/release/leaflet-backend3-{version}.jar
        resource: leaflet-backend3.jar
      target:
        hosts:
          - localhost
      execution:
        via: RUNTIME
        as-user: appuser
        command-name: leaflet-backend3
        runtime: java
      health-check:
        enabled: false
      info:
        enabled: false
`;

export const filesystemRuntimeDeploymentNoUndefinedFields = removeUndefinedFields(filesystemRuntimeDeployment);

export const invalidIDYaml = `
domino:
  deployments:
    abc123:
      source:
        type: FILESYSTEM
`;

export const invalidTooDeepYaml = `
domino:
  deployments:
    app:
      source:
        type: FILESYSTEM
        home: http://localhost/release/leaflet-backend3-{version}.jar
        resource: leaflet-backend3.jar
      target:
        hosts:
          - localhost
      execution:
        via: RUNTIME
        as-user: appuser
        command-name: leaflet-backend3
        runtime: java
        args:
          this:
            is:
              too: "deep"
      health-check:
        enabled: false
      info:
        enabled: false
`;

export const invalidYamlMissingMandatoryParameter = `
domino:
  deployments:
    app:
      source:
        type: FILESYSTEM
`;

export const invalidYamlMalformed = `
domino:
  deployments
    app:
      source:
        type: FILESYSTEM
`;
