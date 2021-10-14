const _ = require('lodash');
const { google } = require('googleapis');

const { v4: uuidv4 } = require('uuid');

module.exports = function (RED) {
  function GoogleConfig(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    if (config.loginType == "oauth") {

    }
    if (config.loginType == "APIKey") {
      var basicCredentials = {
        id: node.id,
        apiKey: node.credentials.apiKey,
        loginType: 'APIKey',
      };
      RED.nodes.addCredentials(node.id, basicCredentials);
    }
    if (config.loginType == "ServiceAccountCredentials") {
      var basicCredentials = {
        id: node.id,
        loginType: 'ServiceAccountCredentials'
      };
      RED.nodes.addCredentials(node.id, basicCredentials);
    }

    var credentials = RED.nodes.getCredentials(node.id);
    console.log(credentials);

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

        if (!credentials.accessToken || !credentials.refreshToken) {
          var error = new Error("accessToken or refreshToken missing");
          return callback(error);
        }

        var conn = new google.auth.OAuth2(
          credentials.clientId,
          credentials.clientSecret,
          credentials.redirectUri
        );
        conn.setCredentials({
          //access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken
        });

        // Refresh accessToken using refreshToken
        conn.on('tokens', (tokens) => {
          console.log("oauthRefresh")
          if(tokens.refresh_token) {
            console.log('refreshToken'. tokens.refresh_token)
            credentials.refreshToken = tokens.refresh_token;
          }
          console.log('accessToken', tokens.access_token)
          credentials.accessToken = tokens.accessToken;
          RED.nodes.addCredentials(node.id, credentials);
        });

        node.conn = conn;
        return callback(null, conn);

      } else if (credentials.loginType === "APIKey") {

        /**
         * APIKey
         */


        // TODO Provide API Key
        var conn = new google.auth.GoogleAuth({});

        node.conn = conn;
        return callback(null, conn);

      } else if (credentials.loginType === "ServiceAccountCredentials") {

        /**
         * ServiceAccountCredentials
         */

        var conn = new google.auth.GoogleAuth({
          keyFile: '/path/to/your-secret-key.json'
        });

        node.conn = conn;
        return callback(null, conn);

      }

    }

  }

  RED.nodes.registerType('google-config', GoogleConfig, {
    credentials: {
      id: { type: 'text' },
      loginType: { type: 'text' },
      username: { type: 'text' },
      apiKey: { type: 'password' },
      clientId: { type: 'password' },
      clientSecret: { type: 'password' },
      scopes: { type: 'text' },
      accessToken: { type: 'password' },
      refreshToken: { type: 'password' },
      userId: { type: 'text' }
    }
  });

  RED.httpAdmin.get('/google/credentials/:id', function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    return res.json({
      userId: credentials.userId
    })
  })

  RED.httpAdmin.post('/google/credentials/:id/reset', function (req, res) {
    var id = req.params.id;
    var credentials = RED.nodes.getCredentials(id);
    credentials.userId = null;
    RED.nodes.addCredentials(id, credentials);
    return res.json({
      userId: credentials.userId
    })
  })

  RED.httpAdmin.get('/google/credentials/:id/auth', function (req, res) {
    var id = req.query.id;
    var googleConfig = RED.nodes.getNode(id);

    var clientId, clientSecret, scopes;
    if (googleConfig && googleConfig.credentials && googleConfig.credentials.clientId) {
      clientId = googleConfig.credentials.clientId;
    } else {
      clientId = req.query.clientId;
    }
    if (googleConfig && googleConfig.credentials && googleConfig.credentials.clientSecret) {
      clientSecret = googleConfig.credentials.clientSecret;
    } else {
      clientSecret = req.query.clientSecret;
    }
    if (googleConfig && googleConfig.credentials && googleConfig.credentials.scopes) {
      scopes = googleConfig.credentials.scopes;
    } else {
      scopes = req.query.scopes;
    }

    var credentials = {
      id: id,
      loginType: 'oauth',
      clientId: clientId,
      clientSecret: clientSecret,
      scopes: scopes,
      redirectUri: req.query.callback
    };

    RED.nodes.addCredentials(id, credentials);

    var oauth2 = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    var authUrl = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes.split(',')
    });
    if (req.query.username) authUrl = authUrl + '&login_hint=' + req.query.username;

    return res.redirect(authUrl);
  });

  RED.httpAdmin.get('/google/credentials/:id/auth/callback', async function (req, res) {
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

    var conn = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    const { tokens } = await conn.getToken(req.query.code)
    console.log(tokens);

    conn.setCredentials(tokens);

    var finalCredentials = {
      id: id,
      loginType: 'oauth',
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      scopes: credentials.scopes,
      redirectUri: credentials.redirectUri,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      userId: uuidv4()
    };

    RED.nodes.addCredentials(id, finalCredentials);

    return res.json({
      message: "Authorised. You can now close this window and go back to Node-RED.",
      credentials: RED.nodes.getCredentials(id)
    });
  });
}
