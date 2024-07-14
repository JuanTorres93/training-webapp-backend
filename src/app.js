// Regular imports
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const morgan = require('morgan');
const passport = require('./passport-config.js');
const { getPool } = require('./db/index.js');

// Function to create the express app. Its main use is for testing
const createApp = (appIsBeingTested = false) => {
    // Create server and enable body parser in order not to import it
    // in every router
    const app = express();
    // Parse HTTP request body to JSON
    app.use(bodyParser.json());
    // Flag to know when the app is being tested by jest or in production
    app.use((req, res, next) => {
        req.appIsBeingTested = appIsBeingTested;
        next();
    });

    // Routers imports
    const usersRouter = require('./endpoints/users/users.js');
    const exercisesRouter = require('./endpoints/exercises/exercises.js');
    const workoutsRouter = require('./endpoints/workouts/workouts.js');
    const workoutsTemplatesRouter = require('./endpoints/workouts.templates/workoutsTemplates.js');
    const loginRouter = require('./endpoints/login/login.js');
    const logoutRouter = require('./endpoints/logout.js');
    const checkoutRouter = require('./endpoints/checkout.js');

    // Enable request logs
    if (!appIsBeingTested) app.use(morgan('short'));

    // CORS configuration
    const corsOptions = {
        // TODO add real client url changing value in .env or adding a new value to include both
        origin: [
            process.env.CLIENT_URL,
        ],
        credentials: true, // Required for cookies, authorization headers with HTTPS
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    };
    app.use(cors(corsOptions));


    // =================
    // Configure session
    // =================

    // IMPORTANT! Storing in-memory sessions is something that should be done only during 
    // development, NOT during production due to security risks.
    // DOCS This line can be uncommented for development purposes, but it should be changed in production
    // const store = new session.MemoryStore();
    // DOCS change store method. Can be founď here: https://www.npmjs.com/package/express-session
    const store = new pgSession({
        pool: getPool(appIsBeingTested),
        tableName: 'user_sessions',
        createTableIfMissing: true,
    });
    // 
    // Cookie for the browser to be able to send session ID back to the server
    const cookie = {
        maxAge: 24 * 60 * 60 * 1000, // milliseconds until cookie expires, in this case 24h
        // TODO uncomment in production (secure), it is now disabled due to not using https in development
        // secure: true, // It's only sent to the server via HTTPS
        sameSite: "none", // Allow cross-site cookie through different browsers
        httpOnly: true, // Specifies whether or not the cookies should be accessible via 
        // JavaScript in the browser (Document.cookie). This setting is set 
        // to true, because it ensures that any cross-site scripting attack (XSS) is impossible
        // Other properties can be 'expires' or 'httpOnly', amongst others
    };

    app.use(session({
        // secret is used as a key for signing and/or encrypting cookies
        // to protect the session ID. Should be a random string NOT INCLUDED in code,
        // but in an ENVIRONMENT VARIABLE
        secret: process.env.EXPRESS_SESSION_SECRET,
        // Setting resave to true will force a session to be saved back to 
        // the session data store, even when no data was modified. Typically, 
        // this option should be false, but also depends on your session storage strategy.
        resave: false,
        // If saveUnititialized is set to true, the server 
        // will store every new session, even if there are no changes to the 
        // session object. This might be useful if we want to keep track of 
        // recurring visits from the same browser, but overall, setting this 
        // property to false allows us to save memory space.
        saveUninitialized: false,
        cookie,
        store,
    }));


    // =====================================
    // Configure passport for authentication
    // =====================================

    // Initialization
    app.use(passport.initialize());
    // Allow persistent logins
    // The session() middleware alters the request object and is able to
    // attach a ‘user’ value that can be retrieved from the session id. 
    app.use(passport.session());


    // =======================
    // Mount endpoints routers
    // =======================

    // Mount users endpoint
    app.use('/users', usersRouter);
    // Mount exercises endpoint
    app.use('/exercises', exercisesRouter);
    // Mount workouts templates endpoint
    app.use('/workouts/templates', workoutsTemplatesRouter);
    // Mount workouts endpoint
    app.use('/workouts', workoutsRouter);
    // Mount login endpoint
    app.use('/login', loginRouter);
    // Mount logout endpoint
    app.use('/logout', logoutRouter);
    // Mount checkout endpoint
    app.use('/checkout', checkoutRouter);

    return app;
}

// Export server instead of starting it for being able to perform tests
module.exports = createApp;
