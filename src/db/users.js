const { query } = require('./index');
const utils = require('../utils/utils.js');

const checkStringInFieldInUse = async (field, value) => {
    const q = "SELECT " + field + 
              " FROM users WHERE LOWER(" + field + ") = LOWER($1);";
    const params = [value];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject({
                error,
                exists: null,
            });

            if (results.rows.length > 0) {
                resolve(true);
            } else {
                reject({
                    error: null,
                    exists: false,
                });
            }
        });
    });
};

const checkEmailInUse = async (email) => {
    try {
        // checkStringInFieldInUse only resolves to true
        return await checkStringInFieldInUse('email', email);
    } catch (error) {
        if (error.error !== null) throw error;

        return false;
    }
};

const checkAliasInUse = async (alias) => {
    try {
        // checkStringInFieldInUse only resolves to true
        return await checkStringInFieldInUse('alias', alias);
    } catch (error) {
        if (error.error !== null) throw error;

        return false;
    }
};

const registerNewUser = async (alias, email, password, 
                         last_name = undefined, 
                         second_last_name = undefined) => {
    // Build query
    // TODO Hash password
    let requiredFields = ['alias', 'email', 'password'];
    let requiredValues = [alias, email, password];

    let optionalFields = ['last_name', 'second_last_name'];
    let optionalValues = [last_name, second_last_name];

    const {fields, values, params} = utils.buildFieldsAndValuesSQLQuery(requiredFields, requiredValues, optionalFields, optionalValues);

    const q = `INSERT INTO users ${fields} ` +
              `VALUES ${values} ` + 
              'RETURNING id, alias, email, last_name, img, second_last_name;';

    return new Promise((resolve, reject) => {

        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdUser = results.rows[0];
            resolve(createdUser)
        })
    });
}


module.exports = {
    checkStringInFieldInUse,
    checkEmailInUse,
    checkAliasInUse,
    registerNewUser,
};