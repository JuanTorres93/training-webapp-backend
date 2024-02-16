const checkKeysInObject = (keysArray, obj) => {
    // Returns true if every key in keysArray is contained in obj keys
    return keysArray.every(key => Object.keys(obj).includes(key))
};

const buildFieldsAndValuesSQLQuery = (fieldNames, fieldParams, optionalFieldNames = [], 
    optionalFieldParams = []) => {
    // IMPORTANT: field and field must be in the same order, corresponding with each other
    if (optionalFieldNames.length !== optionalFieldParams.length) {
        throw new Error('optionalFieldNames and optionalFieldParams must have the same length');
    }
    if (fieldNames.length !== fieldParams.length) {
        throw new Error('fieldNames and fieldParams must have the same length');
    }

    const numberOfRequiredParams = fieldNames.length;
    const allFields = fieldNames;
    const allValues = []
    for (let i = 0; i < fieldParams.length; i++) {
        allValues.push(`$${i + 1}`)
    }

    const params = fieldParams;

    for (let i = 0; i < optionalFieldNames.length; i++) {
        const value = optionalFieldParams[i];

        if (value) {
            allFields.push(optionalFieldNames[i]);
            params.push(value);
            allValues.push(`$${numberOfRequiredParams + i + 1}`)
        };
    }

    const fields = '(' + allFields.join(', ') + ')';
    const values = '(' + allValues.join(', ') + ')';

    return {
        fields, // field db names wrapped in parenthesis
        values, // parametrized values for injecting parameters 
                // in query function. Wrapped in parenthesis. E.g. ($1, $2, $3)
        params, // Actual values to be injected in the db
    };
}

module.exports = {
    checkKeysInObject,
    buildFieldsAndValuesSQLQuery,
}
