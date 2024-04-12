
const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('../validators/errorMessages');

const validateIntegerParameter = paramName => {
    return [
        check(paramName)
            .exists().withMessage(msgs.parameterMissingMsg(paramName))
            .not().isEmpty().withMessage(msgs.parameterEmptyMsg(paramName))
            .isInt().withMessage(msgs.parameterMustBeTypeMsg('integer'))
            .custom(value => {
                if (value > 0) return true;
                return false;
            }).withMessage(`${paramName} must be positive.`)
            .trim()
            .escape()
            .toInt(),

        mw.validateResult(400)
    ];
} 

module.exports = {
    validateIntegerParameter,
};
