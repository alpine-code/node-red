const ApolloClient = require('apollo-client').ApolloClient;
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
const fetch = require('node-fetch');
const HttpLink = require('apollo-link-http').HttpLink;
const WebSocketLink = require('apollo-link-ws').WebSocketLink;
const SubscriptionClient = require('subscriptions-transport-ws').SubscriptionClient;
const WebSocket = require('ws');

module.exports = function (RED) {
  function TheLabConfig(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    const hasuraDomain = process.env.HASURA_GRAPHQL_DOMAIN;
    const hasuraToken = process.env.HASURA_GRAPHQL_TOKEN;

    /**
     * GraphQL Client
     */
    const cache = new InMemoryCache();
    // const link = new HttpLink({
    //   uri: `https://${hasuraDomain}/v1/graphql`,
    //   fetch: fetch
    // });
    const subscriptionClient = new SubscriptionClient(`wss://${hasuraDomain}/v1/graphql`, {
      reconnect: true,
      connectionParams: {
        headers: {
          'content-type': 'application/json',
          'x-hasura-admin-secret': hasuraToken,
        }
      }
    }, WebSocket);
    const link = new WebSocketLink(subscriptionClient);

    const defaultOptions = {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    }

    const client = new ApolloClient({
      cache: cache,
      link: link,
      defaultOptions: defaultOptions,
      name: 'lab-admin',
      version: '1.0',
      queryDeduplication: false
    });

    node.client = client;
  }

  RED.nodes.registerType('thelab-config', TheLabConfig);
}
