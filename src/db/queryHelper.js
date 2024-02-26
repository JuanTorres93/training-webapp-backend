const utils = require('../utils/utils.js');

const createInsertIntoTableStatement = (tableName,
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

const createUpdateTableStatement = (tableName, id, modelObject, returningFields = []) => {
    let q = `UPDATE ${tableName} SET `;
    const params = []
    let variableCount = 1;

    Object.keys(modelObject).forEach(field => {

        if (modelObject[field] !== undefined) {
            q += `${field} = $${variableCount}, `;
            variableCount++;
            params.push(modelObject[field]);
        }
    });

    q = q.substring(0, q.length - 2) + " ";
    q += `WHERE id = $${variableCount} `; 
    params.push(id);

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
    createInsertIntoTableStatement,
    createUpdateTableStatement,
};