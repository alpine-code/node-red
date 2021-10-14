const logger = require('../util/logger');
const ws = require('ws');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { createHttpLink } = require('apollo-link-http');
const { WebSocketLink } = require('apollo-link-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require('graphql-tag');

module.exports = function (RED) {

  function GraphQLConfigNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const options = {
      baseUrl: config.baseUrl,
      baseUrlWs: config.baseUrlWs,
      adminSecret: config.adminSecret
    };

    // Cache
    const cache = new InMemoryCache();

    // HTTP
    const httpLink = createHttpLink({
      fetch: fetch,
      uri: options.baseUrl,
      headers: {
        'X-Hasura-Admin-Secret': options.adminSecret,
      }
    });

    // WS
    const wsSubscription = new SubscriptionClient(options.baseUrlWs, {
      reconnect: true,
      connectionParams: {
        headers: {
          'X-Hasura-Admin-Secret': options.adminSecret,
        }
      }
    }, ws);
    const wsLink = new WebSocketLink(wsSubscription);

    // Client
    node.client = new ApolloClient({
      cache: cache,
      link: wsLink,
      name: '@alpine-code/node-red-contrib-graphql',
      version: '1.0.0',
      queryDeduplication: false,
      defaultOptions: {
        query: {
          fetchPolicy: 'no-cache',
        }
      }
    });

    node.query = function (query, variables) {
      return node.client.query({
        query: gql`${query}`,
        variables
      })
    }

    node.mutate = function (mutation, variables) {
      return node.client.mutate({
        mutation: gql`${mutation}`,
        variables
      })
    }

    node.subscribe = function (subscription, variables) {
      return node.client.subscribe({
        query: gql`${subscription}`,
        variables
      })
    }

    node.on('close', function (done) {
      return done();
    });
  }

  RED.nodes.registerType('graphql-config', GraphQLConfigNode);
};
