# node-red-contrib-camunda

[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
![Release](https://img.shields.io/npm/v/@alpine-code/node-red-contrib-camunda.svg)
![NPM](https://img.shields.io/npm/dm/@alpine-code/node-red-contrib-camunda.svg)

This module leverages the [camunda-external-task-client-js](https://github.com/camunda/camunda-external-task-client-js) client library to bring Camunda awesomeness to Node-RED!
It also interact with the Camunda REST API and supports Basic Auth.

## Nodes

### worker / complete

![task-worker and complete node](docs/worker-complete.png?raw=true)

Creates an external task worker and subscribes to specific topic. The `worker` node outputs a Node-RED message for each newly received external task task.
When a Node-RED message is received at the `complete` nodes's input, that external task gets completed in Camunda (with either success, failure or error).

Please note: These nodes only work in combination. Make sure, the complete object from the worker node output payload gets injected into the input of the complete node.

### create process instance

![workflow-instance node](docs/workflow-instance.png?raw=true)

A new process instance gets started in Camunda, when a Node-RED message is received at the input.

Once the process instance has been created, the output sends a Node-RED message containing some meta-info, i.e. the processInstanceId.

### correlate message

![publish-message node](docs/publish-message.png?raw=true)

This node correlate a message to Camunda, when a Node-RED message is received at the input.

### deploy

![deploy node](docs/deploy.png?raw=true)

Inject a bpmn definition definition string to the input of this node to deploy it to Camunda.

You can use the 'file in' node from Node-RED to read a bpmn file from disk, or get the process definition from anywhere you want.

### variables helper

![variables-helper node](docs/variables-helper.png?raw=true)

To help you build payloads to create process instances or correlate messages, a variable helper is provided.

## Examples

Flow containing examples with all Camunda Nodes.
- worker / complete
- create process instance
- correlate message
- deploy
- variables helper

[flows.json](https://github.com/alpine-code/node-red/packages/node-red-contrib-camunda/docs/flows.json)

![Flow](docs/example-flow.png?raw=true)

[process1.bpmn](https://github.com/alpine-code/node-red/packages/node-red-contrib-camunda/docs/process1.bpmn)

![Process](docs/example-process.png?raw=true)

## Credits

The package is developed and maintained by [Alpine Code](https://www.alpine-code.com/).

