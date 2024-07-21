Domino Platform
======

Domino (abbreviation for '**D**eployment **O**rchestration for **M**inor **I**nfrastructures, powered by **No**de.js') is
a deployment orchestration tool for those who
 * are operating their own application stack on a non-managed environment (e.g. self-configured VPS);
 * have a relatively small application stack that needs a centralized deployment management solution;
 * want to have an easy-to-use application managing the deployment of their own applications;
 * and don't want to waste time (and money) on configuring and operating complex deployment management solutions.

Domino was initially designed to serve the purposes above, and is an actively used deployment management solution for the
[Leaflet blog engine stack](https://github.com/petersmith-hun/leaflet-backend).

**Table of contents**:
1. [Key features](#key-features)
2. [Requirements](#requirements)
3. [Architecture](#architecture)
4. [Installation and configuration](#installation-and-configuration)
5. [Future improvement plans](#future-improvement-plans)

# Key features

1) **REST API**  
Features of Domino Platform are accessible via Domino Coordinator's REST interface.

2) **Configurability**  
Domino Platform provides a variety of configuration options, so it can be aligned for your own needs and environment.

3) **Lifecycle management**  
Domino Platform provides 4 commands (deploy, start, stop, restart) to handle your registered applications via the provided REST API.

4) **Secured access**  
All the endpoints of Domino are secured with JWT-based authentication. The service account can be configured in
Domino's configuration file, or you can use your OAuth authorization server to issue access tokens. 

5) **CLI tool**  
There's also a [CLI tool](https://github.com/petersmith-hun/domino-cli/) specifically created for Domino Platform,
   * providing easy access to Domino's lifecycle management commands;
   * helping in properly creating application deployment configurations;
   * helping in installing Domino Platform components and properly configuring them;
   * encrypting your management account password, etc.

6) **Docker support**  
Domino is also able to handle Docker containers.

7) **Integration with OAuth 2.0 Authorization Server**  
Domino can be integrated with any OAuth 2.0 Authorization Server as a Resource Server (using Client 
Credentials Grant Flow).

8) **Modular architecture**  
Domino Platform is the redesigned version to Domino v1.x, rebuilt from the ground up. Instead of one monolith service,
the system can be installed as small independent components, aligned to your infrastructure needs.

# Requirements

* Windows or Linux (tested on Debian 11 and Ubuntu)
* Docker Engine installed (for Coordinator and Docker Agent)
* Please note, that Binary Executable Agent currently only supports Linux!

# Architecture

Domino Platform is built around a modular architecture style. Currently, there are 3 implemented components, each of them
serving a different purpose:
* **Domino Coordinator**  
This is a simplified but still the most important component of the platform, handling the application deployment 
configurations, coordinating the agents (more on those in a moment), and serving the lifecycle control API. Every Domino
stack setup requires a single instance of this component.
* **Domino Docker Agent**  
Docker based deployments are now handled by this component. You may install multiple instances of this component on
different servers and connect them to the Coordinator.
* **Domino Binary Executable Agent**  
Any application that you'd execute by calling a binary executable file (e.g. a jar, Linux binary, or a zip via runtime)
will be handled by this component. Similarly to the Docker Agent, you may have multiple instances.

The agents are communicating with the Coordinator via a bidirectional websocket connection, opened by the agents towards 
the Coordinator. The agents must securely identify themselves, then the Coordinator (once the connection is accepted) 
keeps track of them, and notifies them once a lifecycle operation is requested. Therefore, the actual deployment operation
is always handled by one of the agents, and because of the websocket connection, they can run anywhere, assuming they
can connect to the Coordinator. The deployment configuration API has been extended with an option to set a target host ID,
which must match with one of the agents own host ID. This allows the Coordinator to handle multiple servers, even with
different infrastructure setup (e.g. 2 servers are running Docker containers, 1 server is running executable binaries).

# Installation and configuration

To install and configure the platform, please follow the relevant guides below:
* [Domino Coordinator](./modules/coordinator/README.md)
* [Domino Docker Agent](./modules/docker-agent/README.md)
* [Domino Binary Executable Agent](./modules/binary-executable-agent/README.md)

# Future improvement plans

The original Domino introduced a couple of useful features - however there are still lots of ideas to be implemented in the future.
Just to mention a few:
 * Additional deployment methods, e.g. Docker Compose-based.
 * Loosen OS requirements (e.g. run on Windows as well).
 * Handling multiple instances of the same application.
 * Dynamic deployment configuration with CI/CD integration capability.

So, there's a long road ahead. Of course Domino is now a fully functional deployment orchestration solution, so if you feel like
giving it a try, don't hesitate. If you have any questions, concerns, ideas, please let me know. Also, if your start using Domino
I'd really like to hear your thoughts about it.
