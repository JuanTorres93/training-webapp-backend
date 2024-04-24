const dbUsers = require('../db/users');
const utils = require('./utils');
const { validationResult } = require('express-validator');
const hash = require('../hashing');

const authenticatedUser = (req, res, next) => {
    try {
        const user = req.session.passport.user;
        next();
    } catch (error) {
        return res.status(401).send("Not logged in.");
    }
};

// This function is an example of how authorization can be implemented.
// I have not tested it because I think I need a browser GUI to keep a session active
// and just Postman is not enough. After posting to /login, it probably doesn't keep
// a session active due to no being a browser.
// Probably, something like this can also be used for authenticated users
const authorizedUser = (req, res, next) => {
  // Check for the authorized property within the session
  if (req.session.authorized) {
    // next middleware function is invoked
    res.next();
  }
  else {
    res.status(403).json({ msg: "You're not authorized to view this page" });
  }
};

const processIntegerURLParameter = category => {
    // Category is just a string appended to the id at the end of the middleware.
    // Its purpose is to differentiate different ids processed in the same
    // response cycle.

    return (req, res, next, id) => {
        let intId;
        try {
            intId = parseInt(id);
        } catch (error) {
            console.log(error);
            return res.status(400).send("Invalid id");
        }

        if (Number.isNaN(intId)) {
            return res.status(400).send("Invalid id");
        }
        
        req[`${category}Id`] = intId;
        next();
    }
};

const validateResult = errorCodeToSend => {
    return (req, res, next) => {
        // DOCS: Source https://www.youtube.com/watch?v=VMRgFfmv6j0
        const result = validationResult(req)

        // This means that there were no errors
        if (result.isEmpty()) {
            return next();
        }

        res.status(errorCodeToSend).send({ errors: result.array() });
    }
};

const checkKeysInBodyRequest = mandatoryBodyParametersArray => {
    // Middleware used for compliying with API spec. It checks that all required parameters
    // are included in the body request
    return (req, res, next) => {
        const parametersAreIncluded = utils.checkKeysInObject(
            mandatoryBodyParametersArray,
            req.body
        );

        if (parametersAreIncluded) return next();

        const msg = `At least one of this parameters is missing: ${mandatoryBodyParametersArray.join(', ')}`

        res.status(400).json({
            msg,
        });
    }
};

const checkUserEmailAndAliasAlreadyExist = async (req, res, next) => {
    // IMPORTANT: This middleware must be called after validating user parameter
    const { alias, email } = req.body;

    // TODO DRY this code
    if (await dbUsers.checkEmailInUse(email, req.appIsBeingTested) === true) {
        return res.status(409).json({
            msg: 'Email already in use',
        });
    }

    if (await dbUsers.checkAliasInUse(alias, req.appIsBeingTested) === true) {
        return res.status(409).json({
            msg: 'Alias already in use',
        });
    }

    next();
}

const checkUserExistsById = async (req, res, next) => {
    // IMPORTANT: This middleware must be called after validating user parameter
    const { userId } = req.params;

    const user = await dbUsers.selectUserById(userId, req.appIsBeingTested);

    if (!user) {
        return res.status(404).json({
            msg: 'User not found',
        });
    };

    next();
}

const hashPassword = async (req, res, next) => {
    // IMPORTANT use this middleware after validating password
    const { password } = req.body;

    if (password) {
        const hashedPassword = await hash.plainTextHash(password)
        req.body.password = hashedPassword;
    }

    next();
}

module.exports = {
    processIntegerURLParameter,
    authenticatedUser,
    checkKeysInBodyRequest,
    validateResult,
    checkUserEmailAndAliasAlreadyExist,
    checkUserExistsById,
    hashPassword,
}
