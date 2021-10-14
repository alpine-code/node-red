# Docker environment with Node-RED and Camunda

This directory contains a profile to run a Node-RED instance and an instance of Camunda.

The components that will be started with this profile:

-   Node-RED
-   Camunda

## Setup

### Prerequisites

-   [Install Docker](https://docs.docker.com/compose/install/)

### Preparation

-   Clone this repository:

```bash
git clone https://github.com/alpine-code/node-red-contrib-camunda
```

### Start the containers

-   Change into this directory:

```bash
cd resources/docker
```

-   Start the profile:

```bash
docker-compose up
```

## How to use

-   Navigate to http://localhost:1880 to access Node-RED
-   Navigate to http://localhost:8080 to access Camunda

## Clean up

### Stop and remove the containers

-   Press `Ctrl-C` to stop the containers.

-   Destroy the stopped containers:

```bash
docker-compose down
```

### Remove persistent data

The `docker-compose.yml` file specifies persistent volumes for Camunda. This means that between executions your data is persisted. You may wish to remove all data to start from nothing. To do this, you need to delete the persistent volumes.

To delete all persistent data:

-   Stop and remove the containers.

-   Run the following command:

```bash
docker volume rm camunda_data
```
