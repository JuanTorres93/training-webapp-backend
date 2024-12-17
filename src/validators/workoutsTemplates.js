const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const { validateUUIDParameter } = require('./generalPurpose');

// Workout params
const userId = 'userId';
const alias = 'alias';
const description = 'description';

// Exercises params
const exerciseId = 'exerciseId';
const exerciseOrder = 'exerciseOrder';
const newExerciseOrder = 'newExerciseOrder';
const exerciseSets = 'exerciseSets';


const validateCreateWorkoutTemplateParams = [
    validateUUIDParameter(userId),
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
    validateUUIDParameter(exerciseId),
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


const validateUpdateExerciseInWorkoutTemplateParams = [
    check(newExerciseOrder)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
        .trim()
        .escape()
        .toInt(),
    check(exerciseSets)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
        .trim()
        .escape()
        .toInt(),

    mw.validateResult(400)
];

module.exports = {
    validateCreateWorkoutTemplateParams,
    validateAddExerciseToWorkoutTemplateParams,
    validateUpdateWorkoutTemplateParams,
    validateUpdateExerciseInWorkoutTemplateParams,
};
