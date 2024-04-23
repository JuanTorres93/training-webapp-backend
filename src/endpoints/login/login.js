const express = require('express');
const bodyParser = require('body-parser');

const passport = require('../../passport-config.js');

const loginValidator = require('../../validators/login.js');

const loginRouter = express.Router();
loginRouter.use(bodyParser.json());


const _loginSuccessful = (req, res, next) => {
    // Callback for handling success
    // NOTE if needed, ot can be redirected to other endpoint instead of send response
    // res.redirect("profile");

    // req.user comes from deserializing the user
    const response = {
        msg: "logged in",
        user: req.user,
    }
    console.log(response);
    return res.json(response);
};

const _loginUnsuccessfull = (err, req, res, next) => {
    // Callback for handling error
    return res.status(401).json({
        msg: "Not logged in",
        err,
    });
}

// Used for retrieving user info after login (with OAuth)
loginRouter.get('/success', (req, res, next) => {
    if (req.user) {
        res.json({
            user: req.user,
        });
    }
});

// End point for failed (OAuth) login requests
loginRouter.get('/failed', (req, res, next) => {
    return res.status(401).json({
        msg: "Not logged in",
        err,
    });
});

// Post request for login with regular credentials
loginRouter.post('/',
    loginValidator.validateLoginUserParams,
    // DOCS
    // passport.authenticate() takes in:
    // 1. A string specifying which strategy to employ. 
    // 2. An optional object as the second argument. In this case, 
    // it's set the FailWithError key to true. This will 
    // allow the use of another callback function to specify the behavior in case of error
    passport.authenticate("local", { failWithError: true }),
    _loginSuccessful,
    _loginUnsuccessfull
);

// Post request for login with google
// This should be opened in the web browser window
loginRouter.get('/google', passport.authenticate("google", { scope: [ 'profile' ] }));
// This is called AFTER authentication
loginRouter.get('/google/callback', passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: '/login/failed',
}));

module.exports = loginRouter;
