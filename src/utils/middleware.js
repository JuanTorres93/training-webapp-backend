const query = require('../db/index').query;
const utils = require('./utils');

const validateCustomerData = (req, res, next) => {
    // TODO hash password (it is already hashed in another part of the code, not sure if needed here)
    const neededKeys = ['first_name', 'last_name', 'email', 'password'];
    const allKeysArePresent = checkKeysInObject(neededKeys, req.body)

    let first_name, last_name, email, password;

    if (allKeysArePresent) {
        first_name = req.body.first_name;
        last_name = req.body.last_name;
        email = req.body.email;
        password = req.body.password;
    } else {
        return res.status(400).send("first_name, last_name, email or password parameter is missing.");
    }

    if (typeof first_name !== 'string' || typeof last_name !== "string" || 
        typeof email !== 'string'  || typeof password !== "string") {
        return res.status(400).send("first_name, last_name, email and password must be strings.");
    }

    // TODO ensure password length = 256

    let second_last_name = null;
    if (Object.keys(req.body).includes('second_last_name')) {
        if (typeof req.body.second_last_name !== 'string') {
            return res.status(400).send("second_last_name must be a string.");
        }

        second_last_name = req.body.second_last_name;
    }

    req.first_name = first_name;
    req.last_name = last_name;
    req.second_last_name = second_last_name;
    req.email = email;
    req.password = password;

    next();
}

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

const checkEmailInUse = (req, res, next) => {
    // THIS MIDDLEWARE MUST BE USED AFTER validateCustomerData
    const { email } = req;

    const q = "SELECT email FROM customers WHERE email = $1";
    const params = [email];

    query(q, params, (error, results) => {
        if (error) throw error;

        // If the email does not exist in the database, then can continue the middleware chain
        if (Object.values(results.rows).length === 0) return next();

        res.status(409).send("email already in use.");
    });
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

module.exports = {
    validateCustomerData,
    checkEmailInUse,
    processIntegerURLParameter,
    authenticatedUser,
    checkKeysInBodyRequest,
}
