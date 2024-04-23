const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const username = 'username'
const password = 'password'

const validateLoginUserParams = [
    check(username)
        .exists().withMessage(msgs.parameterMissingMsg(username))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(username))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(password)
        .exists().withMessage(msgs.parameterMissingMsg(password))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(password))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .isStrongPassword()
        .trim()
        .escape(),
    
    mw.validateResult(400)
];

module.exports = {
    validateLoginUserParams,
};
