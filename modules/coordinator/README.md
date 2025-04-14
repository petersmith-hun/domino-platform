Domino Platform Coordinator
======

Domino Platform Coordinator is the core component of the Domino Platform stack. It manages your configured deployments,
tracks and controls the agents, and most importantly, provides the secured REST API to control the entire Domino stack.

To give you a general overview of the features it supports, here's a list below:
 * Coordinator supports customizing its embedded HTTP server, authorization in two ways (direct and OAuth), logging
and its own identification data; 
 * Application deployments can be configured via a YAML configuration file, so you can store your infrastructure's
deployment configuration as code;
 * Each API endpoint is secured by JWT token based authorization: you may use direct authorization (by configuring a
single local administration account) or using an external OAuth Authorization Server, setting up Coordinator as an
OAuth Resource Server;
 * Supports the standard lifecycle operations, i.e. deploy, start, stop, restart;
 * You may configure a healthcheck endpoint for your application deployment, which is executed right after the start
command, so you get instant feedback about the deployment result;
 * Besides these, you may configure an info endpoint for your application deployment, which you can use to retrieve
some runtime information about it;
 * The latest addition of Coordinator is the Domino Secret Manager module, that lets you store sensitive pieces of data,
specifically for your deployment definitions, but they can also be accessed remotely using Domino's REST API.

**Table of contents**:
1. [Requirements](#requirements)
2. [Installation](#installation)
    1. [Using Domino CLI (recommended)](#using-domino-cli-recommended)
    2. [Manual installation](#manual-installation)
3. [Main configuration](#main-configuration)
    1. [Server configuration](#server-configuration)
    2. [Datasource configuration](#datasource-configuration)
    3. [Encryption configuration](#encryption-configuration)
    4. [Logging configuration](#logging-configuration)
    5. [Authorization configuration](#authorization-configuration)
    6. [Agent configuration](#agent-configuration)
    7. [Coordinator info configuration](#coordinator-info-configuration)
4. [Deployments configuration](#deployments-configuration)
    1. [Source configuration](#source-configuration)
    2. [Execution configuration](#execution-configuration)
        1. [Execution types](#execution-types)
        2. [Execution arguments for Docker deployments](#execution-arguments-for-docker-deployments)
    3. [Health-check configuration](#health-check-configuration)
    4. [Application info endpoint configuration](#application-info-endpoint-configuration)
    5. [Configuration examples](#configuration-examples)
    6. [Required configuration parameters by execution type](#required-configuration-parameters-by-execution-type)
5. [API usage](#api-usage)
    1. [Authentication](#authentication)
    2. [Lifecycle management commands](#lifecycle-management-commands)
    3. [Deployment definition management](#deployment-definition-management)
    4. [Secret management](#secret-management)
    5. [Websocket endpoint](#websocket-endpoint)
6. [Changelog](#changelog)

# Requirements

* Windows or Linux (tested on Debian 11 and Ubuntu)
* Docker Engine installed

# Installation

## Using Domino CLI (recommended)

The recommended way to install Domino Coordinator is using [Domino CLI](https://pypi.org/project/domino-cli/). Please
follow its installation guide (you'll need Python runtime and pip package manager installed). 

Once installed and started up, it is recommended to first create a configuration. In order to do so, type 
`wizard coordinator` and follow the instructions, as well as the [Configuration guide](#main-configuration) below. It 
is also recommended to create at least a dummy deployment configuration right away: to do so, type `wizard deployment` 
and follow the instructions and the configuration guide.

When you are ready, don't close the CLI tool just yet, instead type `wizard installer` then select option `1` 
(Coordinator) to start the installation process. Follow the instructions to proceed. You may use the suggested defaults, 
but it is important to provide the correct path for the directory on your host, where you wish to store the previously 
created Coordinator and deployment configuration files.

## Manual installation

If you are up to some challenge, and you would like to get to know Domino better, you may put together your own
configuration files manually - obviously, it's still recommended to follow the configuration guide below.

Installation of the Coordinator is also possible manually, since it's packaged as a publicly available Docker image. To
do so, run the following command (make sure to change the `<host port>`, `<config files directory>` and `<data directory>`, 
and any other parameter you wish, since these are all "safe defaults"):

```bash
docker run \
  --detach \
  --restart unless-stopped \
  -p <host port>:9987 \
  -v <config files directory>:/opt/coordinator/config:ro \
  -v <data directory>:/opt/coordinator/data:rw \
  --env NODE_CONFIG_DIR=/opt/coordinator/config \
  --env NODE_ENV=coordinator_production,deployments_production \
  --env NODE_OPTIONS=--max_old_space_size=128 \
  --name domino-coordinator \
  psproghu/domino-coordinator:latest
```

Please note, that the provided `NODE_ENV` profile values must match the name of your configuration files, e.g.
 * `coordinator_production` profile implies you have a `coordinator_production.yml` Coordinator configuration file; 
 * while `deployments_production` implies the presence of a `deployments_production.yml` deployment configuration file.

# Main configuration

Domino Coordinator can be configured via YAML configuration files, placed in its configuration directory (the mounted
volume on your host machine). By default, Coordinator uses two separate configuration files per environment, one contains
the main configuration, while the other contains the deployments, although you may also put the deployments in the main
configuration file. It is recommended to follow the same naming convention CLI uses, e.g.:
 * Main configuration file is named `coordinator_production.yml`;
 * Deployments configuration files is named `deployments_production.yml`;
 * Both files are located on your host machine, mounted to Coordinator's container, into the `/opt/coordinator/config`
directory;
 * And `NODE_ENV` is set to `coordinator_production,deployments_production`.

Please note, that in case you have multiple configured environments, you can extract the common parameters into a 
`default.yml` configuration file. Coordinator will read that too, if mounted along with the environment specific ones.
You may also omit the separate deployments configuration file, putting the deployment configurations into the main
configuration file. Details of how to set up a deployment can be found below in the 
[Deployments configuration](#deployments-configuration) section.

## Server configuration

Configuration parameters for Domino's internal web server.

| Parameter                    | Description                                                                                                       |
|------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `domino.server.context-path` | Root path of the API. Defaults to `/`.                                                                            |
| `domino.server.host`         | Host address on which Domino should listen. Specify `0.0.0.0` to listen on all addresses. Defaults to `localhost` |
| `domino.server.port`         | Port on which Domino should listen. Defaults to `9987`.                                                           |

## Datasource configuration

Configuration parameters for Domino's SQLite storage for deployment definitions.

| Parameter                                | Description                                                                                |
|------------------------------------------|--------------------------------------------------------------------------------------------|
| `domino.datasource.sqlite-datafile-path` | Defines the path of the SQLite data file. Defaults to `./data/database.sqlite`.            |
| `domino.datasource.enable-auto-import`   | Enables automatically importing the YAML based deployment definitions. Enabled by default. |

## Encryption configuration

Domino Secret Manager relies on RSA asymmetric key-pair based encryption, to achieve encryption-at-rest functionality. 
By setting the public (for encryption) and private (for decryption) keys, Domino encrypts the secrets before storing them
in the attached SQLite database, and automatically decrypts them on access. Please note, that encryption is an opt-in feature,
but it is highly recommended, as storing sensitive data unencrypted at rest is considered an unsafe practice. If you need
help with generating the necessary PEM formatted RSA key pair, please consult [this Auth0 guide](https://auth0.com/docs/secure/application-credentials/generate-rsa-key-pair).

| Parameter                            | Description                                           |
|--------------------------------------|-------------------------------------------------------|
| `domino.encryption.enabled`          | Enabled/disable encryption-at-rest of stored secrets. |
| `domino.encryption.public-key-path`  | Path of the public RSA key for encryption.            |
| `domino.encryption.private-key-path` | Path of the private RSA key for decryption.           |

## Logging configuration

Controls how Coordinator will publish its logs.

| Parameter                            | Description                                                                      |
|--------------------------------------|----------------------------------------------------------------------------------|
| `domino.logging.min-level`           | Minimum logging level, can be debug, info, warn, error.                          |
| `domino.logging.enable-json-logging` | Enables formatting log messages as JSON text for more convenient log processing. |

## Authorization configuration

Configuring direct or OAuth (JWT token) based authorization.

| Parameter                     | Description                                                                                                                                                                                                            |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `domino.auth.auth-mode`       | Active authorization mode. Defaults to "direct", which is the legacy behavior, using JWT access tokens requested from Domino. Set to "oauth" to change to external OAuth 2.0 Authorization Server based authorization. |
| `domino.auth.expiration`      | Access token expiration in [ms utility](https://github.com/zeit/ms#readme) compatible format.                                                                                                                          |
| `domino.auth.jwt-private-key` | JWT signing private key (HMAC SHA encrypting is used).                                                                                                                                                                 |
| `domino.auth.username`        | Domino management account username.                                                                                                                                                                                    |
| `domino.auth.password`        | Domino management account password. Password must be encrypted before provided here. For encryption it is suggested to use Domino CLI.                                                                                 |
| `domino.auth.oauth-issuer`    | OAuth 2.0 Authorization Server address for access token verification. (Optional, used only in "oauth" authorization mode.)                                                                                             |
| `domino.auth.oauth-audience`  | OAuth audience value of Domino. (Optional, used only in "oauth" authorization mode.)                                                                                                                                   |

_OAuth authorization mode_

Domino can be configured to accept access tokens issued by an external OAuth 2.0 Authorization Server. Currently, only JWT token
based authorization is supported, please make sure to configure the authorization server to generate JWT tokens, if you
wish to use this feature. Also, the recommended grant flow is Client Credentials. 

The integration verifies the token expiration, issuer and audience values on each request, as well as the signature. 
The issuer address (`domino.auth.oauth-issuer` parameter) is also used to acquire the Authorization Server's configuration 
via its discovery endpoint (`/.well-known/oauth-authorization-server`) - please make sure, that the authorization server 
you wish to use, has this endpoint.

The scopes supported by Domino are the following:

| Scope                      | Description                                                                                                |
|----------------------------|------------------------------------------------------------------------------------------------------------|
| `read:info`                | Used by the `/lifecycle/:app/info` endpoint.                                                               |
| `read:deployments`         | Used by the `GET /deployments` and `GET /deployments/:id` endpoints.                                       |
| `read:secrets:metadata`    | Used by the `GET /secrets` and `GET /secrets/:key/metadata` endpoints.                                     |
| `read:secrets:retrieve`    | Used by the `GET /secrets/:key` and `GET /secrets/context/:context` endpoints.                             |
| `write:deploy`             | Used by the `/lifecycle/:app/deploy[/:version]` endpoint.                                                  |
| `write:start`              | Used by the `/lifecycle/:app/start` and `/lifecycle/:app:/restart` endpoints.                              |
| `write:delete`             | Used by the `/lifecycle/:app/stop` and `/lifecycle/:app:/restart` endpoints.                               |
| `write:deployments:create` | Used by the `POST /deployments` endpoint.                                                                  |
| `write:deployments:import` | Used by the `POST /deployments/import` endpoint.                                                           |
| `write:deployments:manage` | Used by the `PUT /deployments/:id`, `PUT /deployments/:id/unlock` and `DELETE /deployments/:id` endpoints. |
| `write:secrets:create`     | Used by the `POST /secrets` endpoint.                                                                      |
| `write:secrets:manage`     | Used by the `PUT/DELETE /secrets/:key/retrieval` and `DELETE /secrets/:key` endpoints.                     |

Further notes:
 * When Domino is set to "oauth" authorization mode, `/claim-token` endpoint is disabled, therefore Domino cannot issue
access tokens directly. This also means, that Domino won't accept such tokens.
 * Audience value is optional, but recommended. If provided, the audience value of the access token must match the one
specified by the `domino.auth.oauth-audience` parameter.
 * Please make sure, that the discovery endpoint of your authorization server publishes the JWK Set endpoint as well.
This is crucial for Domino to be able to verify the access token signature.

## Agent configuration

Configuration parameters of agent-to-Coordinator communication channels, and agent registration.

| Parameter                               | Description                                                                                                                                            |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `domino.agent.operation-timeout`        | Specifies the interval for the agents to respond with for an operation request. (in [ms utility](https://github.com/zeit/ms#readme) compatible format) |
| `domino.agent.api-key`                  | API key for the agents to authorize themselves.                                                                                                        |
| `domino.agent.known-agents`             | Parameters of registered agents as list. Parameters below must match an installed agent's own configuration.                                           |
| `domino.agent.known-agents[].host-id`   | Arbitrary ID of the host the agent is running on.                                                                                                      |
| `domino.agent.known-agents[].type`      | Type of agent, can be `DOCKER` or `FILESYSTEM`.                                                                                                        |
| `domino.agent.known-agents[].agent-key` | Arbitrary key for the agent to distinguish itself from other agents.                                                                                   |

## Coordinator info configuration

Self-identification parameters. Can be used to distinguish instances of Domino Coordinator, if multiple installed.

| Parameter                  | Description                    |
|----------------------------|--------------------------------|
| `domino.info.app-name`     | Full application display name. |
| `domino.info.abbreviation` | Application name abbreviation. |

To get an insight of how a proper configuration should look like, you might want to look into the provided 
[default.yml](/modules/coordinator/config/default.yml) or [test.yml (for unit tests)](/modules/coordinator/config/test.yml)
configuration files.

# Deployments configuration

An application deployment is a description of a deployment "procedure". You need to register all your applications that 
you'd like to have handled by Domino. Currently, registration is not possible via REST API. However, Domino CLI provides 
a convenient way to create new or update existing deployments stored in a .yml file located on the path you have 
provided while setting up your Domino Coordinator instance.

Below you'll find detailed descriptions of all the possible configuration parameters and their requirement-matrix for 
each of the currently supported deployment methods.

First of all, a deployment configuration file should look like this:
 
```yaml
domino:
  deployments:
    <appname1>:
      source: ...
      target: ...
      execution: ...
      health-check: ...
      info: ...
      runtime: ...
    <appname2>:
      source: ...
      target: ...
      execution: ...
      health-check: ...
      info: ...
      runtime: ...
```

An application name (key of the deployment configuration) should conform the following rules:
 * may contain lowercase alphanumerical letters, dashes and underscores, (must start and end with alphanumerical letter);
 * cannot be an empty string;
 * with regular expression: `/^[a-z][a-z-_]*[a-z]+$/`.
 
Application name identifies the deployment itself and will be used in every lifecycle operation (as a path variable) of the request.

Under each application deployment a configuration map should be placed. The possible configuration parameters are the following:

## Source configuration

Source parameters determine where the application's executable is located and how it should be treated.

| Parameter  | Description                                                                                                                                                                                                                |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`     | Type of the executable. Currently `FILESYSTEM` and `DOCKER` are supported, which means either the executable is located in the server's filesystem as a standalone executable binary file or exists as a Docker container. |
| `home`     | Binary source URL or Docker Registry URI. For `FILESYSTEM`-sourced applications, the executable will be downloaded into the configured application home directory.                                                         |
| `resource` | The name of the deployed executable.                                                                                                                                                                                       |

**Notes**
* `home` parameter for `DOCKER`-based applications will determine where the image should be searched for by Docker Engine. Leaving it empty
means the image is located in the central (public) Docker image repository, `hub.docker.com`. Otherwise, the server address should be provided
here in the following format: `<host>:<port>[/<optional-group-name>]`.

## Target configuration

Target configuration determines the actual server instance, where your application is running.

| Parameter | Description                                                                   |
|-----------|-------------------------------------------------------------------------------|
| `hosts`   | List of arbitrary host IDs, where you would like to install your application. |

Please note, that by deploying the same application on multiple hosts, the necessary load balancing should be configured
in your own load balancer solution (e.g. Apache HTTPD, nginx, etc.).

## Execution configuration

Execution parameters determine how the executable should be spun up.

| Parameter      | Description                                                                                                                                                                                                                          |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `via`          | Spin up method for the application. For the currently supported types, please find the options below in the Execution types section.                                                                                                 |
| `command-name` | In case the application requires an explicit command to be executed to spin it up, that should be provided here. Used by the `SERVICE` execution type as the service command name and by `DOCKER` deployments as the container name. |
| `as-user`      | (Usually a service-only) OS user which will execute the application. A group with the same name should also exist.                                                                                                                   |
| `runtime`      | Name of a registered runtime to run application with. Used only by `RUNTIME` typed deployments.                                                                                                                                      |
| `args`         | List of command-line arguments to be passed to the application. See [Required configuration parameters by execution type](#required-configuration-parameters-by-execution-type) for configuration guide of Docker deployments.       |

### Execution types
* `EXECUTABLE`: spin up the application directly via its executable 
* `RUNTIME`: spin up the application with the aid of an external runtime environment
* `SERVICE`: spin up the application via an OS service unit (init.d, systemd, etc.).
* `STANDARD`: standard handling mode for Docker-based deployments; uses pull, run, and standard lifecycle Docker commands

### Execution arguments for Docker deployments

The expected value of `execution.args` parameter is different for `DOCKER` deployments. Instead of a simple list of arguments, the following parameters should be provided:

| Parameter        | Corresponding `docker run` flag                         | Description                                                                                                                    |
|------------------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `restart-policy` | `--restart <policy>`                                    | Restart policy of the container. Standard parameters should be used.                                                           |
| `network-mode`   | `--network <name>`                                      | Network mode.                                                                                                                  |
| `ports`          | `-p <exposed>:<internal>`                               | Port mappings as a map of exposed-internal port pairs.                                                                         |
| `environment`    | `--env <key=value>`                                     | Environment variables to be passed to the container as map of key-value pairs                                                  |
| `commands-args`  | arguments added in the run command after the image name | Command line arguments to be passed to the container.                                                                          |
| `volumes`        | `-v <path-on-host>:<path-in-container>:<mode>`          | Volume mounts. Due to nature of the generated creation request, ro/rw mode flag should always be passed.                       |
| `custom`         | none                                                    | Custom container creation request document accordingly to the Docker Engine API specification. Only for custom configurations! |  

**Notes**

* In most cases the arguments above are enough to spin up a container. For custom requirements, `custom` parameter can be used, however it requires using the exact format as a direct engine API call.
To simplify handling such cases, Docker Compose support is planned to be added to Domino in a later release.
* It is important to mention that all the arguments above are optional. You can spin up your container without any of the parameters above, however port exposure is usually essential.

## Health-check configuration

It is possible to run a health-check right after the application has been deployed and started up.

| Parameter      | Description                                                                                                                   |
|----------------|-------------------------------------------------------------------------------------------------------------------------------|
| `enabled`      | Enables executing health-check. The parameters below can be omitted if you disable health-check.                              |
| `delay`        | Delay before the first and between the subsequent health-check requests. Must be provided in ms-utility format.               |
| `timeout`      | Maximum wait time for a single health-check request. Must be provided in ms-utility format.                                   |
| `max-attempts` | Maximum number of health-check attempts in case of failure. In case an application exceeds this limit, it is considered dead. |
| `endpoint`     | Health-check endpoint of the application                                                                                      |  

## Application info endpoint configuration

| Parameter       | Description                                                                                                          |
|-----------------|----------------------------------------------------------------------------------------------------------------------|
| `enabled`       | Enabled application info endpoint. The parameters below can be omitted if you disable info endpoint.                 |
| `endpoint`      | Application info endpoint URI. (Full path is needed - host, port, context path, path).                               |
| `field-mapping` | Configures how the info endpoint's response should be mapped to Domino's own response. Please see the example below. |

Field mapping happens using target-source field pairs, where source fields are accessed using JSON Path expressions.
An example is provided in the [Configuration example](#configuration-examples) section.

## Configuration examples

Let's consider the following example:
 * You registered an application called `myapp`. It's a `FILESYSTEM` based application which you set via the `source.type` parameter.
 * Domino Platform currently supports publicly available sources for `FILESYSTEM` deployments, e.g. a GitHub release.
In the source path, you may use the `{version}` placeholder, which will be substituted with the version number you are
deploying. Considering this:
 * Its `source.home` is `http://localhost/release/myapp-{version}.jar`.
 * Its `source.resource` is `my-app.jar`.
 * Its `target.hosts` contains one host ID, `remote1`.
 * You have configured the application to run directly via its executable (in other words you set `execution.via` to `EXECUTABLE`).
 * You also added an argument via `execution.args`, let's say it's `--spring.profiles.active=production`.
 * You also set the application to be executed as `my-user` via the `execution.as-user` parameter.

Please note, that deployments of such will be taken care of by the Domino Platform Binary Executable Agent, make sure to
install and configure it properly. Considering that the application home root is `/opt/apps`, the command formed by 
Domino will look something like this (please note that each deployment will have a separate subdirectory in the 
application home root directory):

```
/opt/apps/myapp/my-app.jar --spring.profiles.active=production
```

Domino will also take care of setting the executor user to `my-user`.

Now you decide to change the execution type to `RUNTIME`. For this to work, you configure a runtime, called `java11`:
 * [Runtime will need to be configured](/modules/binary-executable-agent/README.md#runtime-configuration) for Binary Executable Agent. Considering this:
 * `id` is set to `java11`, deployment configuration will refer to this value.
 * Let's say its `binary-path` is located at `/usr/bin/jdk11/bin/java`;
 * The `command-line` for Java applications is always `{args} -jar {resource}` (considering we also want to have some additional arguments)
 * `healtchech` can be set to `--version` (if this call fails, the runtime is not available).
 * (Going back to the deployment configuration.) A minor change is needed for the arguments - in this case it should be 
`-Dspring.profiles.active=production`, as it will be passed directly to the runtime binary.
 * And of course, you need to set `execution.runtime` to `java11`.

This time the command formed by Domino will look something like this:

```
/usr/bin/jdk11/bin/java -Dspring.profiles.active=production -jar /opt/apps/myapp/my-app.jar
```

Again, executor user will be changed to `my-user`.

Another change in the configuration, this time you switch to `SERVICE` based execution. A small update is needed for your configuration:
 * You can remove the `execution.runtime` parameter.
 * You set the `execution.command-name` parameter to `my-app-service`.
 * Also, please make sure that you've already configured the relevant OS service via the configured service subsystem for the agent (`domino.spawn-control.service-handler`).
 * Currently only `systemd` service subsystem is supported, so the example will reflect this.
 
The formed command will look like this:

```
service my-app-service start
```

Important fact, that this time the executor user and arguments parameter have no effect. That's because these settings should be handled by
your service unit file. However, executor user should still be specified as the executable binary file will be `chown`-ed to that user during
deployment. Below you'll find a matrix of the required parameters for each execution types, but Domino CLI can also help you in properly
configuring your deployments.

Before that, let's consider you want to add health-check for your application:
 * You set the `health-check.enabled` parameter to `true` and provide the following parameters as well:
 * You want to wait 5 seconds before the first check, and in case it fails, you want to wait for 5 seconds more before trying again,
 so you set the `health-check.delay` parameter to `5 seconds`;
 * You give the application 2 seconds to respond to a health-check request, so you set the `health-check.timeout` parameter to `2 seconds`;
 * You set `health-check.max-attempts` to `3`, so your application will have 20 seconds in total to spin-up (because Domino waits 5 seconds first),
 then tries to call the application 3 times every 5 seconds.
 * Your application's health-check endpoint is `http://localhost:9999/healthcheck`, so you pass this value to the `health-check.endpoint` parameter.

Moving on to a different configuration type, as the application is now packaged as a Docker container. Consider the following configuration you want 
to have for your container (and also let's not forget that now a Docker Agent will take care of your deployment):
* You set `source.type` to `DOCKER` and `execution.via` to `STANDARD` - this way your deployment is now Docker-based.
* `target.hosts` contains one host ID, `remote2`.
* You want to name your container as `my-app`, so you set `execution.command-name` to this value.
* The image of your application is located in a local Docker registry, reachable via `localhost:5000`, so this will be
the value of `source.home`. In case this is a private repository, please don't forget to [configure its credentials](/modules/docker-agent/README.md#docker-engine-and-registry-configuration).
* The name of the image is `mydockerapp` - `source.resource` should hold this value.
* You want to make some additional fine-tuning to your container, so you set `execution.args` to the following:
    ```yml
    # ...
    args:
      
      # expose port 8080 of your application to 8090 on the host 
      ports:
        8090: 8080
      
      # set an environment parameter, which is passed to your application 
      environment:
        APP_ARGS: --spring.profiles.active=production
  
      # mount a read-write volume, /app from your container to /home/server/mydockerapp/workdir on your server 
      volumes:
        "/home/server/mydockerapp/workdir": "/app:rw"
  
      # change the restart policy so the container would be automatically started on system restart
      restart-policy: unless-stopped
    ```

As an additional step, let's consider a scenario, where you want to map a standard Spring Boot Actuator endpoint response 
with build info as well. Such response looks similar like the following:

```json
{
  "app": {
    "name": "Some Application"
  },
  "build": {
    "version": "1.0.0"
  }
}
```

Using this example, the following configuration ...

```yaml
# ...
info:
  enabled: true
  endpoint: http://localhost:8000/info
  field-mapping:
    name: $.app.name
    version: $.build.version
``` 

... would generate this response:

```json
{
  "name": "Some Application",
  "version": "1.0.0"
}
```

You may find some more examples, put together, in the provided [test.yml (for unit tests)](/modules/coordinator/config/test.yml)
configuration file.


## Required configuration parameters by execution type

| Parameter / exec. type   | executable | runtime    | service    | standard |
|--------------------------|------------|------------|------------|----------|
| `source.type`            | FILESYSTEM | FILESYSTEM | FILESYSTEM | DOCKER   |
| `source.home`            | x          | x          | x          | optional |
| `source.resource`        | x          | x          | x          | x        |
| `execution.command-name` |            |            | x          | x        |
| `execution.as-user`      | x          | x          | x          |          |
| `execution.via`          | EXECUTABLE | RUNTIME    | SERVICE    | STANDARD |
| `execution.args`         | optional   | optional   |            | x        |
| `runtime`                |            | x          |            |          |

# API usage

Domino Coordinator can be used via its REST API. This API can be used with any REST-capable clients (curl, Postman, any 
custom HTTP client implementation, etc.). The recommended way however is to use the aforementioned Domino CLI. 

The following group of endpoints is provided at this point: 

## Authentication

```
POST /claim-token
```

Token claim endpoint can be used to generate a JWT token based on the provided management account access credentials.
The credentials should already be provided under `domino.auth.username` and `domino.auth.password` configuration parameters.

Request body must contain the credentials. Example request (for manual usage):
```
{
    "username": "management-account",
    "password": "P4$$w0rd
}
``` 

The generated JWT token is provided in the response body:

```
{
    "jwt": "<...token...>"
}
```

Possible response statuses:

| Status          | Description                |
|-----------------|----------------------------|
| `201 Created`   | Successfully authenticated |
| `403 Forbidden` | Failed to authenticate     | 

This endpoint is the only one that is accessible without a JWT token (obviously). All the other endpoints require a valid,
non-expired access token, provided as `Authorization: Bearer <token>` header parameter.

## Lifecycle management commands

```
GET /lifecycle/{app}/info
```

Returns information about the running instance of the specified application. Data returned on this endpoint can (and must)
be configured as part of the deployment configuration.

```
PUT /lifecycle/{app}/deploy[/{version}]
```

Deploy endpoint can be used to prepare the selected version of an application for execution. E.g. for filesystem based 
application sources, it means that the executable is copied from the storage to the app's home directory, and it is also
renamed to its expected filename.

Version is optional here - in case it is not provided, the latest uploaded version will be selected and deployed. In this
case please check the response of the endpoint, as it contains the actually deployed version (along with some other
information, please see below).

```
PUT /lifecycle/{app}/start
PUT /lifecycle/{app}/restart
DELETE /lifecycle/{app}/stop
```

The endpoints above execute the corresponding lifecycle command on an already deployed application.

**Response structure**

Response of lifecycle commands always contain:
 * a custom message, usually also containing the elapsed time in milliseconds, that was required to execute the command;
 * also a deployment status value, which provides more accurate insight of what happened due to the command execution;
 * and deploy endpoint also returns the deployed version. 

As an example a response would look like this:

```
{
    "message": "Deployment has finished for version 1.2.0 in 150 ms",
    "status": "DEPLOYED",
    "version": "1.2.0"
}

// or...

{
    "message": "Processed in 3100 ms",
    "status": "HEALTH_CHECK_OK"
}
```

**Possible deployment status values and their corresponding response statuses**

| Deployment status               | Description                                                                                 | Related commands | Mapped HTTP status          |
|---------------------------------|---------------------------------------------------------------------------------------------|------------------|-----------------------------|
| `DEPLOYED`                      | Executable is successfully deployed                                                         | deploy           | `201 Created`               |
| `DEPLOY_FAILED_UNKNOWN`         | Failed to deploy executable - check logs for details                                        | deploy           | `500 Internal Server Error` |
| `DEPLOY_FAILED_MISSING_VERSION` | Deployment failed due to missing requested version                                          | deploy           | `404 Not found`             |
| `UNKNOWN_STARTED`               | Application is supposed to be running, but it is not verified with health-check             | start, restart   | `202 Accepted`              |
| `START_FAILURE`                 | Failed to start application - check logs for details                                        | start            | `500 Internal Server Error` |
| `STOPPED`                       | Application is stopped (verified)                                                           | stop             | `201 Created`               |
| `STOP_FAILURE`                  | Failed to stop application - check logs for details                                         | stop, restart    | `500 Internal Server Error` |
| `UNKNOWN_STOPPED`               | Application is stopped, but it is not verified (might still be running)                     | stop             | `202 Accepted`              |
| `HEALTH_CHECK_OK`               | Application is started and verified by health-check                                         | start, restart   | `201 Created`               |
| `HEALTH_CHECK_FAILURE`          | Application is supposed to be running, but health-check is failing - check logs for details | start, restart   | `500 Internal Server Error` |

## Deployment definition management

```
GET /deployments[?pageSize={pageSize}&pageNumber={pageNumber}]
```

Returns all registered deployments in a paginated form. Without specifying the page attributes (`pageSize` and `pageNumber`),
returns the first 10 deployment definitions.

```
GET /deployments/{id}[?yaml=true]
```

Returns the identified deployment definition (or responds with `HTTP 404 Not Found` if missing). Add `yaml=true` query
parameter to export the deployment definition as YAML.

```
POST /deployments
```

Creates a new deployment definition. Request is expected in JSON format, directly as an internal representation,
described [here](../platform-core/src/lib/platform/api/deployment/index.ts) (parameters are the same as described above,
but their name may differ, e.g. in YAML format you would use kebab-case, but in JSON it's camelCase).

```
POST /deployments/import
```

Imports a deployment definition. Request is expected in YAML format. This is the recommended way of registering new
deployment definition. Imported definitions are locked right away, to avoid any manual changes, considering the import
source to be actual source of truth. You may use this endpoint to automate registering your deployments using a CI/CD
pipeline. Please make sure to start the imported definition with the usual structure, and define only a single deployment
per request (i.e. the request should contain a single-deployment configuration YAML).

```
PUT /deployments/{id}
```

Updates an existing deployment definition (if unlocked). Request is expected in JSON format.

```
PUT /deployments/{id}/unlock
```

Unlocks an existing, imported deployment definition. Please note, that after unlocking a deployment definition, you may 
do changes to it, but re-importing the definition will overwrite those changes.

```
DELETE /deployments/{id}
```

Deletes an existing deployment definition.

## Secret management

```
GET /secrets
```
Retrieves the meta information of all existing secret. Secrets in the response are grouped by their context value.

Example response:
```json
[
    {
        "context": "main",
        "secrets": [
            {
                "key": "home.leaflet",
                "retrievable": false,
                "context": "leaflet",
                "createdAt": "2025-04-07T19:03:54.740Z",
                "updatedAt": "2025-04-07T19:03:54.740Z",
                "lastAccessedAt": null,
                "lastAccessedBy": null
            },
            {
                "key": "home.app2",
                "retrievable": true,
                "context": "leaflet",
                "createdAt": "2025-04-13T12:53:07.231Z",
                "updatedAt": "2025-04-13T12:53:53.028Z",
                "lastAccessedAt": "2025-04-13T12:53:53.028Z",
                "lastAccessedBy": "domino-cli"
            }
        ]
    },
    {
        "context": "other",
        "secrets": [
            {
                "key": "volume:apps:myapp",
                "retrievable": false,
                "context": "lpmc",
                "createdAt": "2025-04-06T16:49:24.357Z",
                "updatedAt": "2025-04-06T17:17:35.356Z",
                "lastAccessedAt": "2025-04-06T17:17:35.356Z",
                "lastAccessedBy": "domino-cli"
            }
        ]
    }
]
```

Possible response statuses:

| Status          | Description                     |
|-----------------|---------------------------------|
| `200 OK`        | Successful response             |

```
GET /secrets/:key/metadata
```
Retrieves the meta information of the given secret. (Response structure is the same as for a single secret entry in the
response example above.)

Possible response statuses:

| Status          | Description                     |
|-----------------|---------------------------------|
| `200 OK`        | Successful response             |
| `404 Not Found` | Requested secret does not exist | 

```
GET /secrets/:key
```
Retrieves the given secret. Also triggers recording who the secret was accessed by. Please note, that only secrets
marked as "retrievable" can be requested via this endpoint. Non-retrievable secrets are only accessible "locally" by
Domino, for substituting secrets in deployment definitions.

Example response:

```json
{
    "volume.app": "/app"
}
```

Possible response statuses:

| Status            | Description                         |
|-------------------|-------------------------------------|
| `200 OK`          | Successful response                 |
| `400 Bad Request` | Requested secret is not retrievable |
| `404 Not Found`   | Requested secret does not exist     |

```
GET /secrets/context/:context
```
Retrieves all secret grouped under the given context. Also triggers recording who the secret was accessed by. Please note,
that if any secret under the requested context is non-retrievable, then this request will fail. Response structure is 
similar to the single-key retrieval endpoint, but will include all resolved secrets.

Possible response statuses:

| Status            | Description                                                     |
|-------------------|-----------------------------------------------------------------|
| `200 OK`          | Successful response                                             |
| `400 Bad Request` | One or more secret in the requested context are not retrievable |

```
POST /secrets
```
Creates a new secret. Created secrets are non-retrievable by default.

Example request:
```json
{
    "key": "secret1",
    "value": "secret-value",
    "context": "ctx"
}
```

Please note, that the following validation rules apply:
 * `key` must adhere the following regex: `^[a-zA-Z][a-zA-Z0-9_.:\-]*$`
 * `context` must adhere the following regex: `^[a-zA-Z0-9]+$`
 * `value` must not be empty

Possible response statuses:

| Status            | Description                                         |
|-------------------|-----------------------------------------------------|
| `201 Created`     | Secret has been created, non-retrievable by default |
| `400 Bad Request` | Validation error, see response for details          |
| `409 Conflict`    | A secret with the same key already exists           |

```
PUT /secrets/:key/retrieval
DELETE /secrets/:key/retrieval
```
Enables/disables retrieval of the given secret.

Possible response statuses:

| Status           | Description                             |
|------------------|-----------------------------------------|
| `204 No Content` | Successfully enabled/disabled retrieval |
| `404 Not Found`  | Requested secret does not exist         |

```
DELETE /secrets/:key
```
Deletes the given secret.

Possible response statuses:

| Status           | Description                 |
|------------------|-----------------------------|
| `204 No Content` | Successfully deleted secret |

## Websocket endpoint

```
/agent
```

Agents may connect to this endpoint, using `ws://` or `wss://` protocol.


For any of the endpoints above it is also possible that `403 Forbidden` is returned in case your JWT token is missing, invalid or expired.

# Changelog

**v2.3.0-4**
* Introducing Domino Secret Manager, along with its management API endpoints
  * Creating only-locally-available (for deployment definitions) and retrievable (remotely accessible) secrets
  * Automatic secret resolution in deployment definitions
  * RSA asymmetric key-pair based encryption
  * Tracking latest secret access (by whom and when)
* General maintenance (updated dependencies to eliminate known vulnerabilities)

**v2.2.0-3**
* Support for dynamic deployment definition management has been added; available operations:
  * List (with pagination) and view deployment definitions 
  * Export stored deployment definitions as YAML-formatted configuration
  * Create deployment definitions
  * Import YAML-formatted deployment definitions (locked for any modification by default)
  * Update and delete existing definitions
* Static deployment configuration is mirrored into the dynamic configuration
  * Considered a "legacy" feature from now on, support will be removed in next major version
* General maintenance (updated dependencies to eliminate known vulnerabilities)

**v2.1.0-2**
* General maintenance (updated dependencies to eliminate known vulnerabilities)

**v2.0.0-1**
* Initial release of Domino Platform Coordinator
