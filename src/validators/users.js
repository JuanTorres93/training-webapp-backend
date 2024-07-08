const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const alias = 'alias'
const email = 'email'
const password = 'password'
const lastName = 'last_name'
const secondLastName = 'second_last_name'

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
        .isStrongPassword().withMessage('Password is not strong enough. It must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character.')
        .trim()
        .escape(),
    check(lastName)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(secondLastName)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    
    mw.validateResult(400)
];

const validateUpdateUserParams = [
    check(alias)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(alias))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(email)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(email))
        .isEmail().withMessage(msgs.parameterValidEmailyMsg())
        // TODO normalize email
        .trim()
        .escape(),
    check(password)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(password))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .isStrongPassword()
        .trim()
        .escape(),
    check(lastName)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(secondLastName)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    
    mw.validateResult(400)
];

module.exports = {
    validateRegisterUserParams,
    validateUpdateUserParams,
};
