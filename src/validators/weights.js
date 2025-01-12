const { check } = require('express-validator');

const mw = require('../utils/middleware');
const msgs = require('./errorMessages');

const { validateUUIDParameter } = require('./generalPurpose');

const userId = 'userId'
const date = 'date'
const value = 'value'

const validateRegisterWeightParams = [
    validateUUIDParameter(userId),
    check(date)
        .exists().withMessage(msgs.parameterMissingMsg(date))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(date))
        .isDate().withMessage(msgs.parameterMustBeTypeMsg('date'))
        .trim()
        .escape(),
    check(value)
        .exists().withMessage(msgs.parameterMissingMsg(value))
        .not().isEmpty().withMessage(msgs.parameterEmptyMsg(value))
        .isFloat().withMessage(msgs.parameterMustBeTypeMsg('float'))
        .trim()
        .escape(),

    mw.validateResult(400)
];


module.exports = {
    validateRegisterWeightParams,
};
