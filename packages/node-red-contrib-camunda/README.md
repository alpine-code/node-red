# node-red-contrib-camunda

[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
![License](https://img.shields.io/github/license/alpine-code/node-red-contrib-camunda.svg)
![Release](https://img.shields.io/npm/v/@alpine-code/node-red-contrib-camunda.svg)
![NPM](https://img.shields.io/npm/dm/@alpine-code/node-red-contrib-camunda.svg)
[![CI](https://github.com/alpine-code/node-red-contrib-camunda/actions/workflows/main.yml/badge.svg)](https://github.com/alpine-code/node-red-contrib-camunda/actions/workflows/main.yml)

This module leverages the [camunda-external-task-client-js](https://github.com/camunda/camunda-external-task-client-js) client library to bring Camunda awesomeness to Node-RED!
It also interact with the Camunda REST API and supports Basic Auth.

## Nodes

### worker / complete

![task-worker and complete node](docs/worker-complete.png)

Creates an external task worker and subscribes to specific topic. The `worker` node outputs a Node-RED message for each newly received external task task.
When a Node-RED message is received at the `complete` nodes's input, that external task gets completed in Camunda (with either success, failure or error).

Please note: These nodes only work in combination. Make sure, the complete object from the worker node output payload gets injected into the input of the complete node.

### create process instance

![workflow-instance node](docs/workflow-instance.png)

A new process instance gets started in Camunda, when a Node-RED message is received at the input.

Once the process instance has been created, the output sends a Node-RED message containing some meta-info, i.e. the processInstanceId.

### correlate message

![publish-message node](docs/publish-message.png)

This node correlate a message to Camunda, when a Node-RED message is received at the input.

### deploy

![deploy node](docs/deploy.png)

Inject a bpmn definition definition string to the input of this node to deploy it to Camunda.

You can use the 'file in' node from Node-RED to read a bpmn file from disk, or get the process definition from anywhere you want.

### variables helper

![variables-helper node](docs/variables-helper.png)

To help you build payloads to create process instances or correlate messages, a variable helper is provided.

## Examples

Flow containing examples with all Camunda Nodes.
- worker / complete
- create process instance
- correlate message
- deploy
- variables helper

[flows.json](https://github.com/alpine-code/node-red-contrib-camunda/blob/master/docs/flows.json)

![Flow](docs/example-flow.png)

[process1.bpmn](https://github.com/alpine-code/node-red-contrib-camunda/blob/master/docs/process1.bpmn)

![Process](docs/example-process.png)

## Credits

The package is developed and maintained by [Alpine Code](https://www.alpine-code.com/).

