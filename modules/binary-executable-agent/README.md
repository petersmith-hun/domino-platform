Domino Platform Binary Executable Agent
======

Domino Platform Binary Executable Agent is responsible for deployments based on directly executable binary packages.
If you have an application packaged into a Linux binary, and you'd like to run it directly, via a specific runtime (e.g.
a .jar package via Java runtime), or as a service, Binary Executable Agent can take care of it. It's a standalone 
component, coordinated by Domino Platform Coordinator, communicating with it via a two-way websocket connection, 
initiated by the agent itself.

**Table of contents**:
1. [Requirements](#requirements)
2. [Installation](#installation)
    1. [Using Domino CLI (recommended)](#using-domino-cli-recommended)
    2. [Manual installation](#manual-installation)
3. [Configuration](#configuration)
    1. [Coordinator connection configuration](#coordinator-connection-configuration)
    2. [Agent identification configuration](#agent-identification-configuration)
    3. [Logging configuration](#logging-configuration)
    4. [Spawn control configuration](#spawn-control-configuration)
    5. [Storage configuration](#storage-configuration)
    6. [Runtime configuration](#runtime-configuration)
4. [Changelog](#changelog)

# Requirements

* Linux (tested on Debian 11 and Ubuntu)

Please note, that while the rest of the Domino Platform stack can be installed on Windows as well, Binary Executable
Agent is only able to run on Linux systems, due to some current limitations.

# Installation

Please note, that agents must be installed on the host machine running your application.

## Using Domino CLI (recommended)

The recommended way to install Domino Binary Executable Agent is using [Domino CLI](https://pypi.org/project/domino-cli/). 
Please follow its installation guide (you'll need Python runtime and pip package manager installed).

Once installed and started up, it is recommended to first create a configuration. In order to do so, type
`wizard bin-exec-agent` and follow the instructions, as well as the [Configuration guide](#configuration) below.

When you are ready, don't close the CLI tool just yet, instead type `wizard installer` then select option `3`
(Binary Executable Agent) to start the installation process. Follow the instructions to proceed. You may use the 
suggested defaults, but it is important to provide the correct path for the directory on your host, where you wish to 
store the previously created Binary Executable Agent configuration file and the agent's own executable.

Please note, that since this agent spawns processes on the host machine, its packaging is standalone binary executable, 
instead of a Docker container, so it can directly communicate with the host system. In case your deployments are 
configured as services, or the application is executed under a different user than the agent, you will need to run the
agent as root. The agent itself is installed as an auto-starting systemd service.

## Manual installation

If you are up to some challenge, and you would like to get to know Domino better, you may put together your own
configuration file manually - obviously, it's still recommended to follow the configuration guide below.

Installation is also possible manually - in this case, please do the following steps:
 * Download the agent binary from the Releases section of this repository (look for the latest release starting with the
name `binary-executable-agent-linux-x64-...` and download the `domino-binary-executable-agent` file).
 * Create a systemd service descriptor, or choose your own way of running the agent. If you decide to stick to systemd,
here's a template below:
```
[Unit]
Description=Domino Platform Binary Executable Agent

[Service]
User=root
WorkingDirectory=<workdir>
Environment=NODE_ENV=<profile> NODE_CONFIG_DIR=<confdir>
ExecStart=<workdir>/domino-binary-executable-agent
SuccessExitStatus=143
TimeoutStopSec=10
Restart=yes

[Install]
WantedBy=multi-user.target
```

Please note, that the provided `NODE_ENV` profile value must match the name of your configuration file, e.g.
`binary_executable_agent_production` profile implies you have a `binary_executable_agent_production.yml` Binary Executable 
Agent configuration file. Also make sure to properly set the `<workdir>` and `<confdir>` values.

# Configuration

Domino Binary Executable Agent can be configured via YAML configuration files, placed in its configuration directory. 
It is recommended to follow the same naming convention CLI uses, e.g.:
* Configuration file is named `binary_executable_agent_production.yml`;
* And `NODE_ENV` is set to `binary_executable_agent_production`.

Please note, that in case you have multiple configured environments, you can extract the common parameters into a
`default.yml` configuration file. Binary Executable Agent will read that too, if mounted along with the environment 
specific ones.

## Coordinator connection configuration

Configuration parameters to define how the agent can communicate with Coordinator.

| Parameter                                | Description                                                                                                                                                                                                                  |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `domino.agent.coordinator.host`          | Domino Coordinator API host address. The agent will open a WebSocket connection to this address, must start with `ws://` or `wss://` and end with `/agent` (Domino Coordinator exposes this path for the agents to connect.) |
| `domino.agent.coordinator.api-key`       | API key to be used for authenticating with the Domino Coordinator.                                                                                                                                                           |
| `domino.agent.coordinator.ping-interval` | Interval of the agent to ping Coordinator to keep the connection alive (in ms time string format).                                                                                                                           |
| `domino.agent.coordinator.pong-timeout`  | Maximum wait time for ping to be confirmed by Coordinator (in ms time string format).                                                                                                                                        |


## Agent identification configuration

Agent self-identification parameters.

| Parameter                               | Description                                                          |
|-----------------------------------------|----------------------------------------------------------------------|
| `domino.agent.identification.host-id`   | Arbitrary ID of the host the agent is running on.                    |
| `domino.agent.identification.type`      | Type of agent, should always be `FILESYSTEM` for this agent.         |
| `domino.agent.identification.agent-key` | Arbitrary key for the agent to distinguish itself from other agents. |

## Logging configuration

Controls how the agent will publish its logs.

| Parameter                            | Description                                                                      |
|--------------------------------------|----------------------------------------------------------------------------------|
| `domino.logging.min-level`           | Minimum logging level, can be debug, info, warn, error.                          |
| `domino.logging.enable-json-logging` | Enables formatting log messages as JSON text for more convenient log processing. |

## Spawn control configuration

Control how the applications should be spawned. 

| Parameter                                     | Description                                                                                                      |
|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `domino.spawn-control.service-handler`        | Service subsystem to be used for service-based execution. Currently only systemd service subsystem is supported. |
| `domino.spawn-control.start-delay`            | Process start delay on restart (in ms time string format).                                                       |
| `domino.spawn-control.auto-unpack`            | Enables automatically unpacking .zip deployment packages.                                                        |
| `domino.spawn-control.allowed-executor-users` | List of allowed process executor users. Listed users must exist on the host system.                              |

In case your deployment source is a .zip archive, it is possible to automatically unpack it and run it using a runtime,
or even directly, if the .zip archive contains a binary executable (just set `source.resource` to the executable within
the archive).

## Storage configuration

Controls where to store the deployments' source packages, as well as the executed application binaries.

| Parameter                              | Description                                         |
|----------------------------------------|-----------------------------------------------------|
| `domino.storage.deployment-store-path` | Storage path for downloaded deployment executables. |
| `domino.storage.application-home-path` | Application work directory root path.               |

## Runtime configuration

Registers the external runtimes to run `RUNTIME` deployments.

| Parameter                       | Description                                                                                                    |
|---------------------------------|----------------------------------------------------------------------------------------------------------------|
| `domino.runtime[].id`           | Runtime internal identifier (this ID must be referenced in the deployment configuration, `execution.runtime`). |
| `domino.runtime[].binary-path`  | Runtime executable path.                                                                                       |
| `domino.runtime[].healthcheck`  | Runtime healthcheck command (to test if runtime exists and can run).                                           |
| `domino.runtime[].command-line` | Runtime command (to run the deployment).                                                                       |

In the runtime command-line parameter, you may use the following parameters:
 * `{args}`: refers to the `execution.args` deployment parameter;
 * `{resource}`: refers to the `source.resource` deployment parameter.

To get an insight of how a proper configuration should look like, you might want to look into the provided
[default.yml](/modules/binary-executable-agent/config/default.yml) or [test.yml (for unit tests)](/modules/binary-executable-agent/config/test.yml)
configuration files. Deployment configuration examples can be found in the [root README.md](/README.md) of this repository.

# Changelog

**v1.1.0-3**
* General maintenance (updated dependencies to eliminate known vulnerabilities)

**v1.0.0-1**
* Initial release of Domino Platform Binary Executable Agent
