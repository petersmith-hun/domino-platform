Domino Platform Docker Agent
======

Domino Platform Docker Agent is responsible for Docker based deployments. It's a standalone component, coordinated by 
Domino Platform Coordinator, communicating with it via a two-way websocket connection, initiated by the agent itself.

Simply put, this agent is able to spin up Docker containers, based on the deployment configurations defined in Coordinator.
It can pull the images from private Docker registries as well.

**Table of contents**:
1. [Requirements](#requirements)
2. [Installation](#installation)
    1. [Using Domino CLI (recommended)](#using-domino-cli-recommended)
    2. [Manual installation](#manual-installation)
3. [Configuration](#configuration)
    1. [Coordinator connection configuration](#coordinator-connection-configuration)
    2. [Agent identification configuration](#agent-identification-configuration)
    3. [Logging configuration](#logging-configuration)
    4. [Docker Engine and registry configuration](#docker-engine-and-registry-configuration)
4. [Changelog](#changelog)

# Requirements

* Windows or Linux (tested on Debian 11 and Ubuntu)
* Docker Engine installed

# Installation

Please note, that agents must be installed on the host machine running your application.

## Using Domino CLI (recommended)

The recommended way to install Domino Docker Agent is using [Domino CLI](https://pypi.org/project/domino-cli/). Please
follow its installation guide (you'll need Python runtime and pip package manager installed).

Once installed and started up, it is recommended to first create a configuration. In order to do so, type
`wizard docker-agent` and follow the instructions, as well as the [Configuration guide](#configuration) below.

When you are ready, don't close the CLI tool just yet, instead type `wizard installer` then select option `2`
(Docker Agent) to start the installation process. Follow the instructions to proceed. You may use the suggested defaults,
but it is important to provide the correct path for the directory on your host, where you wish to store the previously
created Docker Agent configuration file.

## Manual installation

If you are up to some challenge, and you would like to get to know Domino better, you may put together your own
configuration file manually - obviously, it's still recommended to follow the configuration guide below.

Installation of the Docker Agent is also possible manually, since it's packaged as a publicly available Docker image. To
do so, run the following command (make sure to change the `<host port>` and `<config files directory>`, and any other
parameter you wish, since these are all "safe defaults"):

```bash
docker run \
  --detach \
  --restart unless-stopped \
  -v <config files directory>:/opt/docker-agent/config:ro \
  --env NODE_CONFIG_DIR=/opt/docker-agent/config \
  --env NODE_ENV=docker_agent_production \
  --env NODE_OPTIONS=--max_old_space_size=64 \
  --name domino-docker-agent \
  psproghu/domino-docker-agent:latest
```

Please note, that the provided `NODE_ENV` profile values must match the name of your configuration file, e.g. 
`docker_agent_production` profile implies you have a `docker_agent_production.yml` Docker Agent configuration file.

# Configuration

Domino Docker Agent can be configured via YAML configuration files, placed in its configuration directory (the mounted
volume on your host machine). It is recommended to follow the same naming convention CLI uses, e.g.:
* Configuration file is named `docker_agent_production.yml`;
* It is located on your host machine, mounted to Docker Agent's container, into the `/opt/docker-agent/config`
  directory;
* And `NODE_ENV` is set to `docker_agent_production`.

Please note, that in case you have multiple configured environments, you can extract the common parameters into a
`default.yml` configuration file. Docker Agent will read that too, if mounted along with the environment specific ones.

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
| `domino.agent.identification.type`      | Type of agent, should always be `DOCKER` for this agent.             |
| `domino.agent.identification.agent-key` | Arbitrary key for the agent to distinguish itself from other agents. |

## Logging configuration

Controls how the agent will publish its logs.

| Parameter                            | Description                                                                      |
|--------------------------------------|----------------------------------------------------------------------------------|
| `domino.logging.min-level`           | Minimum logging level, can be debug, info, warn, error.                          |
| `domino.logging.enable-json-logging` | Enables formatting log messages as JSON text for more convenient log processing. |

## Docker Engine and registry configuration

Docker Engine and Docker registry configuration.

| Parameter                          | Description                                                                                                                           |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `domino.docker.connection.uri`     | Docker Engine server URI. Usually either `/var/run/docker.sock` for socket connection, or `http://localhost:2375` for TCP connection. |
| `domino.docker.connection.type`    | Type of Docker Engine connection, can be `socket` or `tcp`.                                                                           |
| `domino.docker.servers`            | List of private Docker Registry hosts with their credentials.                                                                         |
| `domino.docker.servers[].host`     | Docker Registry server address (with port).                                                                                           |
| `domino.docker.servers[].username` | Docker Registry server username.                                                                                                      |
| `domino.docker.servers[].password` | Docker Registry server password.                                                                                                      |

To get an insight of how a proper configuration should look like, you might want to look into the provided
[default.yml](/modules/docker-agent/config/default.yml) or [test.yml (for unit tests)](/modules/docker-agent/config/test.yml)
configuration files. Deployment configuration examples can be found in the [root README.md](/README.md) of this repository.

# Changelog

**v1.1.0-2**
* General maintenance (updated dependencies to eliminate known vulnerabilities)

**v1.0.0-1**
* Initial release of Domino Platform Docker Agent
