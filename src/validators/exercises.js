const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const name = 'name'
const description = 'description'

const validateCreateExerciseParams = [
    check(name)
        .exists().withMessage(msgs.parameterMissingMsg(name))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(name))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(description)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),

    mw.validateResult(400)
];

const validateUpdateExerciseParams = [
    check(name)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(name))
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),
    check(description)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape(),

    mw.validateResult(400)
];

module.exports = {
    validateCreateExerciseParams,
    validateUpdateExerciseParams,
};
