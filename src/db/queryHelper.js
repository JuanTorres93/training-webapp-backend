const utils = require('../utils/utils.js');

const createInsertIntoTableStatment = (tableName,
                                       requiredFields, requiredValues,
                                       optionalFields, optionalValues,
                                       returningFields = []) => {
    // requiredFields -> mandatory fields of the data base that cannot be NULL
    // optionalFields -> other fields that can be added
    // requiredValues -> values of the mandatory fields to update, provided in the same order
    // optionalValues -> values of the optional fields to update, provided in the same order
    
    if (typeof requiredFields !== 'object' || typeof requiredFields !== 'object' ||
        typeof requiredFields !== 'object' || typeof requiredFields !== 'object' ||
        typeof returningFields !== 'object') {
            throw new Error('All parameters need to be arrays');
        }

    const {fields, values, params} = utils.buildFieldsAndValuesSQLQuery(requiredFields, requiredValues, optionalFields, optionalValues);

    let q = `INSERT INTO ${tableName} ${fields} ` +
              `VALUES ${values} `;
    
    if (returningFields.length > 0) {
        q += 'RETURNING '
        q += returningFields.join(', ');
    };

    q += ';';

    return {
        q,
        params,
    };
}

module.exports = {
    createInsertIntoTableStatment,
};