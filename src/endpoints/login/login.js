// TODO add login to swagger
const express = require('express');
const bodyParser = require('body-parser');

const passport = require('../../passport-config.js');

const loginValidator = require('../../validators/login.js');
const config = require('../../config.js');
const mw = require('../../utils/middleware.js');

const loginRouter = express.Router();
loginRouter.use(bodyParser.json());

const _computeExpirationDate = () => {
    // Cookie age from now
    const expirationTimeInMs = config.MAX_COOKIE_AGE_MILLISECONDS //- 2 * 60 * 1000; // 2 minutes before expiration
    const expirationDate = new Date(Date.now() + expirationTimeInMs).toISOString(); // Send as ISO string (UTC);

    return expirationDate;
}

const _loginSuccessful = (req, res, next) => {
    // Callback for handling success
    // NOTE if needed, ot can be redirected to other endpoint instead of send response
    // res.redirect("profile");

    const user = {
        ...req.user,
        expirationDate: _computeExpirationDate(),
    };

    // req.user comes from deserializing the user
    const response = {
        msg: "logged in",
        user,
    }
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
        const user = {
            ...req.user,
            expirationDate: _computeExpirationDate(),
        };

        const userAsURLParams = new URLSearchParams(user).toString();

        res.redirect(`${process.env.CLIENT_URL}/?${userAsURLParams}`);
    }
});

// End point for failed (OAuth) login requests
loginRouter.get('/failed', (req, res, next) => {
    const infoForClient = {
        msg: 'Login failed',
    };

    const infoAsURLParams = new URLSearchParams(infoForClient).toString();

    res.redirect(`${process.env.CLIENT_URL}/login/?${infoAsURLParams}`);
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
loginRouter.get('/google', passport.authenticate("google", { scope: ['profile', 'email'] }));
// This is called AFTER authentication
loginRouter.get('/google/callback',
    passport.authenticate("google", {
        successRedirect: '/login/success',
        failureRedirect: '/login/failed',
    }));

// Extend session endpoint
loginRouter.post('/extend-session',
    mw.authenticatedUser,
    (req, res, next) => {
        if (req.session) {
            // Temporarily store the authenticated Passport user
            const user = req.user;

            req.session.regenerate((err) => {
                if (err) {
                    return res.status(400).json({ message: 'Session could not be extended.' });
                } else {
                    // Restore the authenticated user in the new session
                    req.login(user, (err) => {
                        if (err) {
                            return res.status(400).json({ message: 'Error restoring user after session regeneration.' });
                        }

                        // With the user restored, the cookie will be updated
                        return res.status(200).json({
                            message: 'Session successfully extended.',
                            expirationDate: req.session.cookie.expires,
                        });
                    });
                }
            });

        } else {
            res.status(400).json({ message: 'Session could not be extended.' });
        }
    });

module.exports = loginRouter;
