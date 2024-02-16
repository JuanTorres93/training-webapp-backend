const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const alias = 'alias'
const email = 'email'
const password = 'password'
const lastName = 'last_name'
const secondLastName = 'second_last_name'

// TODO add trim to all cases
const validateRegisterUserParams = [
    check(alias)
        .exists().withMessage(msgs.parameterMissingMsg(alias))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(alias))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(email)
        .exists().withMessage(msgs.parameterMissingMsg(email))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(email))
        .isEmail().withMessage(msgs.parameterValidEmailyMsg())
        // TODO normalize email
        .trim()
        .escape(),
    check(password)
        .exists().withMessage(msgs.parameterMissingMsg(password))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(password))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        // TODO add isStrongPassword validator
        .trim()
        .escape(),
    check(lastName)
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(secondLastName)
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    
    mw.validateResult(400)
];

module.exports = {
    validateRegisterUserParams,
};
