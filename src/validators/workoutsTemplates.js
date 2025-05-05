const { check } = require("express-validator");

const mw = require("../utils/middleware");
const msgs = require("./errorMessages");

const { validateUUIDParameter } = require("./generalPurpose");

// Workout params
const userId = "userId";
const name = "name";
const description = "description";

// Exercises params
const exerciseId = "exerciseId";
const exerciseOrder = "exerciseOrder";
const newExerciseOrder = "newExerciseOrder";
const exerciseSets = "exerciseSets";

const validateCreateWorkoutTemplateParams = [
  validateUUIDParameter(userId),
  check(name)
    .exists()
    .withMessage(msgs.parameterMissingMsg(name))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(name))
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),
  check(description)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),

  mw.validateResult(400),
];

const validateAddExerciseToWorkoutTemplateParams = [
  validateUUIDParameter(exerciseId),
  check(exerciseOrder)
    .exists()
    .withMessage(msgs.parameterMissingMsg(exerciseOrder))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(exerciseOrder))
    .isInt()
    .withMessage(msgs.parameterMustBeTypeMsg("integer"))
    .trim()
    .escape()
    .toInt(),
  check(exerciseSets)
    .exists()
    .withMessage(msgs.parameterMissingMsg(exerciseSets))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(exerciseSets))
    .isInt()
    .withMessage(msgs.parameterMustBeTypeMsg("integer"))
    .trim()
    .escape()
    .toInt(),

  mw.validateResult(400),
];

const validateUpdateWorkoutTemplateParams = [
  check(name)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),
  check(description)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),

  mw.validateResult(400),
];

const validateUpdateExerciseInWorkoutTemplateParams = [
  check(newExerciseOrder)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isInt()
    .withMessage(msgs.parameterMustBeTypeMsg("integer"))
    .trim()
    .escape()
    .toInt(),
  check(exerciseSets)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isInt()
    .withMessage(msgs.parameterMustBeTypeMsg("integer"))
    .trim()
    .escape()
    .toInt(),

  mw.validateResult(400),
];

module.exports = {
  validateCreateWorkoutTemplateParams,
  validateAddExerciseToWorkoutTemplateParams,
  validateUpdateWorkoutTemplateParams,
  validateUpdateExerciseInWorkoutTemplateParams,
};
