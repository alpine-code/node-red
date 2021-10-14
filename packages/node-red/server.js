const dotenv = require('dotenv');
var http = require('http');
var express = require("express");

dotenv.config();

require('./src/app/helpers/logger')
const logger = require('winston').loggers.get('server');

var app = express();
var server = http.createServer(app);

app.set('views', './src/app/views')
app.set('view engine', 'pug')

var expressSession = require('express-session');
var session = {
    secret: 'abc',
    cookie: {
        secure: false
    },
    resave: false,
    saveUninitialized: true
};
app.use(expressSession(session));

var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var strategy = new Auth0Strategy(
    {
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
        return done(null, profile);
    }
);
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

let RED = require('./src/red/index');

var authRouter = require('./src/app/routes/auth');
var pluginRouter = require('./src/app/routes/plugin');
var redRouter = RED.router;

app.use("/public", express.static("./src/app/public"));
app.use('/auth', authRouter);
app.use('/plugin', pluginRouter);
app.use('/', redRouter);

app.use(function (req, res, next) {
    res.status(404).send('Not Found')
})

app.use(function (err, req, res, next) {
    res.status(500).send('Error')
})

RED.start(server);

server.listen(1880);