var _ = require('lodash');
var moment = require('moment');

function _readProcessDefinitions(client) {
    return client.processDefinitionService.list().then(results => {
        return _.map(results.items, result => {
            return {
                id: result.id,
                key: result.key,
                name: result.name,
                version: result.version
            }
        })
    })
}

function _readProcessInstances(client, processDefinitionKey, processBusinessKey) {
    let payload = {};
    if(processDefinitionKey) payload.processDefinitionKey = processDefinitionKey;
    if(processBusinessKey) payload.businessKey = processBusinessKey;
    return client.processInstanceService.list(payload).then(results => {
        return _.map(results, result => {
            return {
                id: result.id,
                processBusinessKey: result.businessKey,
                processDefinitionId: result.definitionId
            }
        })
    })
}

function _readTasks(client, processDefinitionKey, processBusinessKey) {
    let payload = {};
    if(processDefinitionKey) payload.processDefinitionKey = processDefinitionKey;
    if(processBusinessKey) payload.processInstanceBusinessKey = processBusinessKey;
    return client.taskService.list(payload).then(results => {
        return _.map(results._embedded.task, result => {
            return {
                id: result.id,
                key: result.formKey,
                name: result.name,
                description: result.description,
                assignee: result.assignee,
                priority: result.priority,
                creation_date: moment(result.created).toISOString(),
                dueDate: moment(result.due).toISOString(),
                followUpDate: moment(result.followUp).toISOString(),
                processDefinitionId: result.processDefinitionId,
                processInstanceId: result.processInstanceId,
                taskDefinitionKey: result.taskDefinitionKey,
            }
        })
    })
}

function _readProcessDefinition(client, id) {
    return client.processDefinitionService.get(id).then(result => {
        return {
            id: result.id,
            key: result.key,
            name: result.name,
            version: result.version
        }
    })
}

function _readProcessInstance(client, id) {
    return client.processInstanceService.get(id).then(result => {
        return {
            id: result.id,
            processBusinessKey: result.businessKey,
            processDefinitionId: result.definitionId
        }
    })
}

function _readTask(client, id) {
    return client.taskService.get(id).then(result => {
        return {
            id: result.id,
            key: result.formKey,
            name: result.name,
            description: result.description,
            assignee: result.assignee,
            priority: result.priority,
            creation_date: moment(result.created).toISOString(),
            dueDate: moment(result.due).toISOString(),
            followUpDate: moment(result.followUp).toISOString(),
            processDefinitionId: result.processDefinitionId,
            processInstanceId: result.processInstanceId,
            taskDefinitionKey: result.taskDefinitionKey,
        }
    })
}

function _startProcessInstance(client, processDefinitionKey, processBusinessKey, processVariables) {
    let payload = {
        key: processDefinitionKey,
        businessKey: processBusinessKey,
        variables: processVariables
    };
    return client.processDefinitionService.start(payload).then(result => {
        return {
            id: result.id,
            processBusinessKey: result.businessKey,
            processDefinitionId: result.definitionId
        }
    })
}

function _stopProcessInstance(client, processDefinitionKey, processBusinessKey) {
    let payload = {
        processInstanceQuery: {
            businessKey: processBusinessKey,
            processDefinitionKey: processDefinitionKey
        }
    };
    return client.processInstanceService.deleteAsync(payload).then(result => {
        return {
            id: result.id
        }
    })
}

function _correlateMessage(client, name, processBusinessKey, correlationKeys, processVariables) {
    let payload = {
        messageName: name,
        businessKey: processBusinessKey,
        correlationKeys: correlationKeys,
        processVariables: processVariables,
        all: true,
        resultEnabled: true
    };
    return client.messageService.correlate(payload).then(results => {
        return _.map(results, result => {
            return {
                resultType: result.resultType.toLowerCase(),
                processInstance: {
                    id: _.get(result, 'processInstance.id'),
                    processBusinessKey: _.get(result, 'processInstance.businessKey'),
                    processDefinitionId: _.get(result, 'processInstance.definitionId'),
                },
                execution: {
                    id: _.get(result, 'execution.id'),
                    processInstanceId: _.get(result, 'execution.processInstanceId'),
                }
            }
        });
    })
}

function _getForm(client, taskId, names) {
    return client.taskService.form(taskId).then(result => {
        return client.taskService.formVariables({
            id: taskId,
            names: names
        }).then(variables => {
            return {
                key: result.key,
                variables: variables
            }
        })
    })
}

function _getRenderedForm(client, taskId) {
    return client.taskService.formRendered(taskId).then(result => {
        return {
            html: result.toString()
        };
    })
}

function _submitForm(client, taskId, variables) {
    let _variables = variables;
    return client.taskService.submitForm({
        id: taskId,
        variables: _variables
    }).then(result => {
        return _variables;
    })
}

function _deployProcessDefinition(client, deploymentName, source) {
    let payload = {
        deploymentName: deploymentName,
        files: [{ 
            name: `${deploymentName}.bpmn`,
            content: source
        }]
    };
    return client.deploymentService.create(payload).then(result => {
        return {
            id: result.id
        }
    })
}

exports.readProcessDefinitions = _readProcessDefinitions;
exports.readProcessInstances = _readProcessInstances;
exports.readTasks = _readTasks;
exports.readProcessDefinition = _readProcessDefinition;
exports.readProcessInstance = _readProcessInstance;
exports.readTask = _readTask;
exports.startProcessInstance = _startProcessInstance;
exports.stopProcessInstance = _stopProcessInstance;
exports.correlateMessage = _correlateMessage;
exports.getForm = _getForm;
exports.getRenderedForm = _getRenderedForm;
exports.submitForm = _submitForm;
exports.deployProcessDefinition = _deployProcessDefinition;