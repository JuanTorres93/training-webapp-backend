const { query } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'users';

const checkStringInFieldInUse = async (field, value, appIsBeingTested) => {
    const q = "SELECT " + field + 
              " FROM " + TABLE_NAME + " WHERE LOWER(" + field + ") = LOWER($1);";
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

const registerNewUser = ({ alias, email, password, last_name, second_last_name },
                                appIsBeingTested = undefined) => {
    // Build query
    let requiredFields = ['alias', 'email', 'password'];
    let requiredValues = [alias, email, password];

    let optionalFields = ['last_name', 'second_last_name'];
    let optionalValues = [last_name, second_last_name];

    let returningFields = ['id', 'alias', 'email', 'last_name', 'img', 'second_last_name']

    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME, 
                                                           requiredFields, requiredValues,
                                                           optionalFields, optionalValues,
                                                           returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdUser = results.rows[0];
            resolve(createdUser)
        }, appIsBeingTested)
    });
}

const selectAllUsers = (appIsBeingTested) => {
    const q = "SELECT id, alias, email, last_name, img, second_last_name FROM " + TABLE_NAME + ";";
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
              TABLE_NAME + " WHERE id = $1;";
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
    let returningFields = ['id', 'alias', 'email', 'last_name', 'img', 'second_last_name'];

    const { q, params } = qh.createUpdateTableStatement(TABLE_NAME, id, 
                                                        userObject,
                                                        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedUser = results.rows[0];
            resolve(updatedUser)
        }, appIsBeingTested)
    });
}

const deleteUser = async (id, appIsBeingTested = undefined) => {
    let q = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " + 
            "RETURNING id, alias, email, last_name, img, second_last_name;";
    const params = [id]

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const deletedUser = results.rows[0];
            resolve(deletedUser)
        }, appIsBeingTested)
    });
}

const truncateTableTest = (appIsBeingTested) => {
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            resolve('Table ' + TABLE_NAME + ' truncated in test db.')
        }, true)
    });
};

const testDbSelectEverythingFromUserId = (id, appIsBeingTested) => {
    const q = "SELECT * FROM " + TABLE_NAME + " WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            resolve(results.rows[0]);
        }, true);
    });
};

module.exports = {
    checkStringInFieldInUse,
    checkEmailInUse,
    checkAliasInUse,
    registerNewUser,
    selectAllUsers,
    selectUserById,
    updateUser,
    deleteUser,
    truncateTableTest,
    testDbSelectEverythingFromUserId,
};