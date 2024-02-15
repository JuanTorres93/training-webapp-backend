const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');

const passport = require('./passport-config.js');
const apiRouter = require('./endpoints/api.js');
const registerRouter = require('./endpoints/register.js');
const loginRouter = require('./endpoints/login.js');
const logoutRouter = require('./endpoints/logout.js');
const cartRouter = require('./endpoints/cart.js');
const checkoutRouter = require('./endpoints/checkout.js');

// Create server
app = express();

// Enable request logs
app.use(morgan('short'));

// Parse HTTP request body to JSON
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
    // TODO add real server url
    origin: ["http://localhost:54321",
        "http://localhost:3000",
        "https://ecommerce-server-codecademy-portfolio.onrender.com",
    ],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));


// =================
// Configure session
// =================

// IMPORTANT! Storing in-memory sessions is something that should be done only during 
// development, NOT during production due to security risks.
// TODO Change store method. Can be founď here: https://www.npmjs.com/package/express-session
const store = new session.MemoryStore();

// Cookie for the browser to be able to send session ID back to the server
const cookie = {
    maxAge: 24 * 60 * 60 * 1000, // milliseconds until cookie expires, in this case 24h
    // TODO uncomment in production, it is now disabled due to not using https in development
    // secure: true, // It's only sent to the server via HTTPS
    sameSite: "none", // Allow cross-site cookie through different browsers
    httpOnly: true, // Specifies whether or not the cookies should be accessible via JavaScript in the browser (Document.cookie). 
    // This setting is forced to true, because it ensures that any cross-site scripting attack (XSS) is impossible
    // Other properties can be 'expires' or 'httpOnly', amongst others
};

app.use(session({
    // secret is used as a key for signing and/or encrypting cookies
    // to protect the session ID. Should be a random string NOT INCLUDED in code,
    // but in an ENVIRONMENT VARIABLE
    // TODO store in an environment variable
    secret: "33c5ddc51abb31b1cca3c145ede3b544dca2de115a155c4d55ab1b12eb544de5415e12b5b3b24c52e2a135c5e1cacd4b13444cea51ebe3d5c1ebbab411aaa4314115a5ce2a52244cad4a4eba44ca353d1d1beced1b1c53de55cbde52d2b4a42dc4aa3dcc53d4b2c4315ecaa31a4ebdac2c2ecdebbdac5d2ecd451a1ac112bda4",
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

// Mount API endpoints
app.use('/api', apiRouter);
// Mount register endpoint
app.use('/register', registerRouter);
// Mount login endpoint
app.use('/login', loginRouter);
// Mount logout endpoint
app.use('/logout', logoutRouter);
// Mount cart endpoint
app.use('/cart', cartRouter)
// Mount checkout endpoint
app.use('/checkout', checkoutRouter)

// Export server instead of starting it for being able to perform tests
module.exports = app;
