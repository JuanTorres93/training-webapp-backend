const { query } = require('./index');
const utils = require('../utils/utils.js');

const checkStringInFieldInUse = async (field, value, appIsBeingTested) => {
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

            if (results !== undefined && results.rows.length > 0) {
                resolve(true);
            } else {
                reject({
                    error: null,
                    exists: false,
                });
            }
        }, appIsBeingTested);
    });
};

const checkEmailInUse = async (email, appIsBeingTested) => {
    try {
        // checkStringInFieldInUse only resolves to true
        const exists = await checkStringInFieldInUse('email', email, appIsBeingTested);
        return exists
    } catch (error) {
        if (error.error !== null) throw error;

        return false;
    }
};

const checkAliasInUse = async (alias, appIsBeingTested) => {
    try {
        // checkStringInFieldInUse only resolves to true
        return await checkStringInFieldInUse('alias', alias, appIsBeingTested);
    } catch (error) {
        if (error.error !== null) throw error;

        return false;
    }
};

const registerNewUser = async (alias, email, password, 
                         last_name = undefined, 
                         second_last_name = undefined,
                         appIsBeingTested = undefined) => {
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
        }, appIsBeingTested)
    });
}

const selectAllUsers = (appIsBeingTested) => {
    const q = "SELECT id, alias, email, last_name, img, second_last_name FROM users;";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const users = results.rows;
            resolve(users)
        }, appIsBeingTested)
    });
};

const selectUserById = async (id, appIsBeingTested) => {
    const q = "SELECT id, alias, email, last_name, img, second_last_name FROM " +
              "users WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const user = results.rows[0];
            resolve(user)
        }, appIsBeingTested)
    });
};

const updateUser = async (id, userObject, appIsBeingTested = undefined) => {
    // TODO Hash password
    let q = 'UPDATE users SET ';
    const params = []
    let variableCount = 1;

    Object.keys(userObject).forEach(field => {

        if (userObject[field] !== undefined) {
            q += `${field} = $${variableCount}, `;
            variableCount++;
            params.push(userObject[field]);
        }
    });

    q = q.substring(0, q.length - 2) + " ";
    q += `WHERE id = $${variableCount} `; 
    params.push(id);

    q += 'RETURNING id, alias, email, last_name, img, second_last_name;';

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedUser = results.rows[0];
            resolve(updatedUser)
        }, appIsBeingTested)
    });
}


module.exports = {
    checkStringInFieldInUse,
    checkEmailInUse,
    checkAliasInUse,
    registerNewUser,
    selectAllUsers,
    selectUserById,
    updateUser,
};