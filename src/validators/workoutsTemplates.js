const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

// Workout params
const userId = 'userId';
const alias = 'alias';
const description = 'description';

// Exercises params
const exerciseId = 'exerciseId';
const exerciseSet = 'exerciseSet';
const reps = 'reps';
const weight = 'weight';
const timeInSeconds = 'time_in_seconds';


const validateCreateWorkoutTemplateParams = [
    check(userId)
        .exists().withMessage(msgs.parameterMissingMsg(userId))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(userId))
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('string'))
        .trim()
        .escape()
        .toInt(),
    check(alias)
        .exists().withMessage(msgs.parameterMissingMsg(alias))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(alias))
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
    validateCreateWorkoutTemplateParams,
};
