const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

// Workout params
const userId = 'userId';
const alias = 'alias';
const description = 'description';

// Exercises params
const exerciseId = 'exerciseId';
const exerciseOrder = 'exerciseOrder';
const exerciseSets = 'exerciseSets';


const validateCreateWorkoutTemplateParams = [
    check(userId)
        .exists().withMessage(msgs.parameterMissingMsg(userId))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(userId))
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
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


const validateAddExerciseToWorkoutTemplateParams = [
    check(exerciseId)
        .exists().withMessage(msgs.parameterMissingMsg(exerciseId))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(exerciseId))
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
        .trim()
        .escape()
        .toInt(),
    check(exerciseOrder)
        .exists().withMessage(msgs.parameterMissingMsg(exerciseOrder))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(exerciseOrder))
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
        .trim()
        .escape()
        .toInt(),
    check(exerciseSets)
        .exists().withMessage(msgs.parameterMissingMsg(exerciseSets))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(exerciseSets))
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
        .trim()
        .escape()
        .toInt(),
    
    mw.validateResult(400)
];


const validateUpdateWorkoutTemplateParams = [
    check(alias)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
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
    validateAddExerciseToWorkoutTemplateParams,
    validateUpdateWorkoutTemplateParams,
};
