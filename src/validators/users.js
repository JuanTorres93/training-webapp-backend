const { check } = require("express-validator");

const mw = require("../utils/middleware");
const msgs = require("./errorMessages");

const { validateUUIDParameter } = require("../validators/generalPurpose");

const username = "username";
const email = "email";
const subscriptionId = "subscription_id";
const password = "password";
const isPremium = "is_premium";
const isEarlyAdopter = "is_early_adopter";
const createdAt = "created_at";
const oauthRegistration = "oauth_registration";

const validateRegisterUserParams = [
  check(username)
    .exists()
    .withMessage(msgs.parameterMissingMsg(username))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(username))
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),
  check(email)
    .exists()
    .withMessage(msgs.parameterMissingMsg(email))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(email))
    .isEmail()
    .withMessage(msgs.parameterValidEmailyMsg())
    // TODO normalize email
    .trim()
    .escape(),
  check(password)
    .exists()
    .withMessage(msgs.parameterMissingMsg(password))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(password))
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .isStrongPassword()
    .withMessage(
      "Password is not strong enough. It must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character."
    )
    .trim()
    .escape(),
  check(isPremium)
    .exists()
    .withMessage(msgs.parameterMissingMsg(isPremium))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(isPremium))
    .isBoolean()
    .withMessage(msgs.parameterMustBeTypeMsg("boolean"))
    .trim()
    .escape()
    .toBoolean(),
  check(isEarlyAdopter)
    .exists()
    .withMessage(msgs.parameterMissingMsg(isEarlyAdopter))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(isEarlyAdopter))
    .isBoolean()
    .withMessage(msgs.parameterMustBeTypeMsg("boolean"))
    .trim()
    .escape()
    .toBoolean(),
  check(createdAt)
    .exists()
    .withMessage(msgs.parameterMissingMsg(createdAt))
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(createdAt))
    // TODO check
    .isISO8601()
    .withMessage(msgs.parameterMustBeTypeMsg("ISO8601 date"))
    .trim()
    .escape(),
  check(subscriptionId)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isUUID()
    .withMessage(msgs.parameterMustBeTypeMsg("UUID"))
    .trim()
    .escape(),
  check(oauthRegistration)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),

  mw.validateResult(400),
];

// TODO update on refactor
const validateUpdateUserParams = [
  check(username)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(username))
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),
  check(email)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(email))
    .isEmail()
    .withMessage(msgs.parameterValidEmailyMsg())
    // TODO normalize email
    .trim()
    .escape(),
  check(password)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .not()
    .isEmpty()
    .withMessage(msgs.parameterEmptyMsg(password))
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .isStrongPassword()
    .trim()
    .escape(),
  check(isPremium)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),
  check(isEarlyAdopter)
    // TODO Not in this app, process optional in another way. I think this can be a security flaw
    .optional()
    .isString()
    .withMessage(msgs.parameterMustBeTypeMsg("string"))
    .trim()
    .escape(),

  mw.validateResult(400),
];

module.exports = {
  validateRegisterUserParams,
  validateUpdateUserParams,
};
