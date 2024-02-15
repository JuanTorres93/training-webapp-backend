const express = require('express');
const bodyParser = require('body-parser');

const query = require('../db/index').query;
const utils = require('../utils/utils.js');

const logoutRouter = express.Router();
logoutRouter.use(bodyParser.json());

logoutRouter.get("/", (req, res, next) => {
    req.logout((err) => {
        if (err) throw err;
        // if (err) { return next(err); }

        // TODO add valid route?
        // res.redirect("/");
        res.send("Logged out");
    });
});

module.exports = logoutRouter;
