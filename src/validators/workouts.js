const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const { validateUUIDParameter } = require('../validators/generalPurpose');

// Workout params
const name = 'name';
const description = 'description';

// Exercises params
const exerciseId = 'exerciseId';
const exerciseSet = 'exerciseSet';
const reps = 'reps';
const weight = 'weight';
const timeInSeconds = 'time_in_seconds';

const validateCreateWorkoutParams = [
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

const validateUpdateWorkoutParams = [
    check(name)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
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

const validateAddExerciseToWorkoutParams = [
    validateUUIDParameter(exerciseId),
    check(exerciseSet)
        .exists().withMessage(msgs.parameterMissingMsg(exerciseSet))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(exerciseSet))
        .isInt()
        .escape(),
    check(reps)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(reps))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(reps))
        .isInt()
        .escape(),
    check(weight)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(weight))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(weight))
        .isFloat()
        .escape(),
    check(timeInSeconds)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(timeInSeconds))
        // .not().isEmpty().withMessage(msgs.parameterEmptyMsg(timeInSeconds))
        // .isInt()
        .escape(),

    mw.validateResult(400)
];

const validateUpdateExerciseInWorkoutParams = [
    validateUUIDParameter(exerciseId),
    check(exerciseSet)
        .exists().withMessage(msgs.parameterMissingMsg(exerciseSet))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(exerciseSet))
        .isInt()
        .escape(),
    check(reps)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(reps))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(reps))
        .isInt()
        .escape(),
    check(weight)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(weight))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(weight))
        .isFloat()
        .escape(),
    check(timeInSeconds)
        // TODO IMPORTANT process optional in another way. I think this can be a security flaw
        .optional()
        .exists().withMessage(msgs.parameterMissingMsg(timeInSeconds))
        // .not().isEmpty().withMessage(msgs.parameterEmptyMsg(timeInSeconds))
        // .isInt()
        .escape(),

    mw.validateResult(400)
];

module.exports = {
    validateCreateWorkoutParams,
    validateUpdateWorkoutParams,
    validateAddExerciseToWorkoutParams,
    validateUpdateExerciseInWorkoutParams,
};
