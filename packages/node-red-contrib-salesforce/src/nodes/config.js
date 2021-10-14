module.exports = function (RED) {
  'use strict';
  var jsforce = require('jsforce');

  function SalesforceConfigNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    if (config.loginType == "oauth") {

    }
    if (config.loginType == "Username-Password") {
      var basicCredentials = {
        id: node.id,
        username: config.username,
        password: node.credentials.password,
        loginType: 'Username-Password',
        loginUrl: config.loginUrl
      };
      RED.nodes.addCredentials(node.id, basicCredentials);
    }
    if (config.loginType == "Signed-Request") {
      var basicCredentials = {
        id: node.id,
        loginType: 'Signed-Request'
      };
      RED.nodes.addCredentials(node.id, basicCredentials);
    }

    var credentials = RED.nodes.getCredentials(node.id);

    // The connection.
    node.conn = null;

    node.login = function (msg, callback) {

      if (node.conn) {
        return callback(null, node.conn);
      }

      if (credentials.loginType === "oauth") {

        /**
         * oauth
         */

        if (!credentials.accessToken || !credentials.refreshToken || !credentials.instanceUrl) {
          var error = new Error("accessToken, refreshToken or instanceUrl missing");
          return callback(error);
        }

        console.log(credentials);

        var conn = new jsforce.Connection({
          oauth2: {
            loginUrl: credentials.loginUrl,
            clientId: credentials.clientId,
            clientsecret: credentials.clientSecret,
            redirectUri: credentials.redirectUri
          },
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          instanceUrl: credentials.instanceUrl
        });

        // Refresh accessToken using refreshToken
        // conn.oauth2.refreshToken(credentials.refreshToken, (err, results) => {
        //   credentials.accessToken = results['access_token'];
        //   RED.nodes.addCredentials(node.id, credentials);
        // });

        // Refresh accessToken using refreshToken
        conn.on("refresh", function (accessToken, res) {
          console.log("oauthRefresh")
          console.log('accessToken', accessToken)
          credentials.accessToken = accessToken;
          RED.nodes.addCredentials(node.id, credentials);
        });

        node.conn = conn;
        return callback(null, conn);

      } else if (credentials.loginType === "Username-Password") {

        /**
         * Username-Password
         */

        var conn = new jsforce.Connection({
          loginUrl: credentials.loginUrl
        });

        conn.login(credentials.username, credentials.password, function (error, userInfo) {
          if (error) {
            return callback(error);
          } else {
            node.conn = conn;
            return callback(null, conn);
          }
        });

      } else if (credentials.loginType === "Signed-Request") {

        /**
         * Signed-Request
         */

        var accessToken = msg.accessToken;
        var instanceUrl = msg.instanceUrl;

        var conn = new jsforce.Connection({
          accessToken: accessToken,
          instanceUrl: instanceUrl
        });

        node.conn = conn;
        return callback(null, conn);

      }
    }
  }

  RED.nodes.registerType('salesforce-config', SalesforceConfigNode, {
    credentials: {
      id: { type: 'text' },
      loginUrl: { type: 'text' },
      loginType: { type: 'text' },
      username: { type: 'text' },
      password: { type: 'password' },
      clientId: { type: 'password' },
      clientSecret: { type: 'password' },
      accessToken: { type: 'password' },
      refreshToken: { type: 'password' },
      instanceUrl: { type: 'text' },
      userId: { type: 'text' }
    }
  });

  RED.httpAdmin.get('/force/credentials/:id', function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    return res.json({
      userId: credentials.userId
    })
  })

  RED.httpAdmin.post('/force/credentials/:id/reset', function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    credentials.userId = null;
    RED.nodes.addCredentials(id, credentials);
    return res.json({
      userId: credentials.userId
    })
  })

  RED.httpAdmin.get('/force/credentials/:id/auth', function (req, res) {
    var id = req.query.id;
    var salesforceConfig = RED.nodes.getNode(id);

    var clientId, clientSecret;
    if (salesforceConfig && salesforceConfig.credentials && salesforceConfig.credentials.clientId) {
      clientId = salesforceConfig.credentials.clientId;
    } else {
      clientId = req.query.clientId;
    }
    if (salesforceConfig && salesforceConfig.credentials && salesforceConfig.credentials.clientSecret) {
      clientSecret = salesforceConfig.credentials.clientSecret;
    } else {
      clientSecret = req.query.clientSecret;
    }

    var credentials = {
      id: id,
      loginType: 'oauth',
      loginUrl: req.query.loginUrl,
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: req.query.callback
    };

    // var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
    // credentials.csrfToken = csrfToken;
    // res.cookie('csrf', csrfToken);

    RED.nodes.addCredentials(id, credentials);

    var oauth2 = new jsforce.OAuth2({
      loginUrl: credentials.loginUrl,
      clientId: credentials.clientId,
      clientsecret: credentials.clientSecret,
      redirectUri: credentials.redirectUri
    });

    // var authUrl = oauth2.getAuthorizationUrl({ state: req.query.id + ":" + csrfToken });
    var authUrl = oauth2.getAuthorizationUrl({
      scope: 'api id web refresh_token'
    });
    if (req.query.username) authUrl = authUrl + '&login_hint=' + req.query.username;

    return res.redirect(authUrl);
  });

  RED.httpAdmin.get('/force/credentials/:id/auth/callback', function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);

    if (!req.query.code) {
      return res.send("ERROR: missing authorization code");
    }

    // var state = req.query.state.split(':');
    // var id = state[0];

    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return res.send("ERROR: missing credentials");
    }
    // if (state[1] !== credentials.csrfToken) {
    //   return res.status(401).send("CSRF token mismatch, possible cross-site request forgery attempt.");
    // }

    var conn = new jsforce.Connection({
      oauth2: {
        loginUrl: credentials.loginUrl,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: credentials.redirectUri
      }
    });

    conn.authorize(req.query.code, function (err, userInfo) {
      if (err) {
        return res.send(err.message);
      }

      var finalCredentials = {
        id: id,
        loginType: 'oauth',
        loginUrl: credentials.loginUrl,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: credentials.redirectUri,
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        instanceUrl: conn.instanceUrl,
        userId: userInfo.id
      };

      RED.nodes.addCredentials(id, finalCredentials);

      return res.json({
        message: "Authorised. You can now close this window and go back to Node-RED.",
        credentials: RED.nodes.getCredentials(id)
      });
    });
  });
}
