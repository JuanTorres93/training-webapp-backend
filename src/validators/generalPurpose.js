
const { check } = require('express-validator');

const mw = require('../utils/middleware');

const validateIntegerParameter = paramName => {
    return [
        check(paramName)
            .exists().withMessage(msgs.parameterMissingMsg(alias))
            .not().isEmpty().withMessage(msgs.parameterEmptyMsg(alias))
            .isString().withMessage(msgs.parameterMustBeTypeMsg('string'))
            .trim()
            .escape(),

        mw.validateResult(400)
    ];
} 

module.exports = {
    validateIntegerParameter,
};
