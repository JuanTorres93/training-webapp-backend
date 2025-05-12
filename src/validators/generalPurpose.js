const { check } = require("express-validator");

const mw = require("../utils/middleware");
const msgs = require("../validators/errorMessages");

const validateIntegerParameter = (paramName) => {
  return [
    check(paramName)
      .exists()
      .withMessage(msgs.parameterMissingMsg(paramName))
      .not()
      .isEmpty()
      .withMessage(msgs.parameterEmptyMsg(paramName))
      .isInt()
      .withMessage(msgs.parameterMustBeTypeMsg("integer"))
      .custom((value) => {
        if (value > 0) return true;
        return false;
      })
      .withMessage(`${paramName} must be positive.`)
      .trim()
      .escape()
      .toInt(),

    mw.validateResult(400),
  ];
};

const validateUUIDParameter = (paramName) => {
  return [
    check(paramName)
      .exists()
      .withMessage(msgs.parameterMissingMsg(paramName))
      .not()
      .isEmpty()
      .withMessage(msgs.parameterEmptyMsg(paramName))
      .isUUID()
      .withMessage(msgs.parameterMustBeTypeMsg("UUID"))
      .trim()
      .escape(),

    mw.validateResult(400),
  ];
};

const validateStringParameter = (paramName) => {
  return [
    check(paramName)
      .exists()
      .withMessage(msgs.parameterMissingMsg(paramName))
      .not()
      .isEmpty()
      .withMessage(msgs.parameterEmptyMsg(paramName))
      .isString()
      .withMessage(msgs.parameterMustBeTypeMsg("string"))
      .custom((value) => {
        if (value !== "") return true;
        return false;
      })
      .withMessage(`${paramName} must not be empty.`)
      .trim()
      .escape(),

    mw.validateResult(400),
  ];
};

const validateEmailParameter = (paramName) => {
  return [
    check(paramName)
      .exists()
      .withMessage(msgs.parameterMissingMsg(paramName))
      .not()
      .isEmpty()
      .withMessage(msgs.parameterEmptyMsg(paramName))
      .isEmail()
      .withMessage(msgs.parameterMustBeTypeMsg("email"))
      .normalizeEmail(),

    mw.validateResult(400),
  ];
};

const validateStrongPasswordParameter = (paramName) => {
  return [
    check(paramName)
      .exists()
      .withMessage(msgs.parameterMissingMsg(paramName))
      .not()
      .isEmpty()
      .withMessage(msgs.parameterEmptyMsg(paramName))
      .isString()
      .withMessage(msgs.parameterMustBeTypeMsg("string"))
      .isStrongPassword()
      .withMessage(
        `${paramName} must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one symbol.`
      )
      .trim()
      .escape(),

    mw.validateResult(400),
  ];
};

module.exports = {
  validateIntegerParameter,
  validateStringParameter,
  validateUUIDParameter,
  validateEmailParameter,
  validateStrongPasswordParameter,
};
