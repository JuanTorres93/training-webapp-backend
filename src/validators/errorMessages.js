const parameterMissingMsg = (parameterName) => {
    return `Parameter ${parameterName} is missing`;
}

const parameterEmptyMsg = (parameterName) => {
    return `Parameter ${parameterName} cannot be empty`;
}

const parameterValidEmailyMsg = () => {
    return 'Must be a valid email address';
}

const parameterMustBeTypeMsg = (type) => {
    return `Must be type ${type}`;
}

module.exports = {
    parameterMissingMsg,
    parameterEmptyMsg,
    parameterValidEmailyMsg,
    parameterMustBeTypeMsg,
};
