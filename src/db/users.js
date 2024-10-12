const { query } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'users';
const SELECT_USER_FIELDS = 'id, alias, email, last_name, img, second_last_name';

const checkStringInFieldInUse = async (field, value) => {
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
        });
    });
};

const checkEmailInUse = async (email) => {
    try {
        // checkStringInFieldInUse only resolves to true
        const exists = await checkStringInFieldInUse('email', email);

        return exists
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

const registerNewUser = ({
    alias,
    email,
    password,
    last_name,
    second_last_name,
    registeredViaOAuth,
}) => {

    // Build query
    let requiredFields = ['alias', 'email', 'password', 'registeredviaoauth'];
    let requiredValues = [alias, email, password, registeredViaOAuth];

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
        })
    });
}

const selectAllUsers = () => {
    const q = "SELECT " + SELECT_USER_FIELDS + " FROM " + TABLE_NAME + ";";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const users = results.rows;
            resolve(users)
        })
    });
};

const selectUserById = async (id) => {
    const q = "SELECT " + SELECT_USER_FIELDS + " FROM " +
        TABLE_NAME + " WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const user = results.rows[0];
            resolve(user)
        })
    });
};

const selectUserByEmail = async (email) => {
    const q = "SELECT " + SELECT_USER_FIELDS + " FROM " +
        TABLE_NAME + " WHERE email = $1;";
    const params = [email];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const user = results.rows[0];
            resolve(user)
        })
    });
};

const selectUserRegisteredByOAuth = async (email) => {
    const q = "SELECT registeredviaoauth FROM " +
        TABLE_NAME + " WHERE email = $1;";
    const params = [email];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const registeredViaOAuth = results.rows[0].registeredviaoauth;
            resolve(registeredViaOAuth)
        })
    });
};


const updateUser = async (id, userObject) => {
    let returningFields = ['id', 'alias', 'email', 'last_name', 'img', 'second_last_name'];

    const { q, params } = qh.createUpdateTableStatement(TABLE_NAME, id,
        userObject,
        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedUser = results.rows[0];
            resolve(updatedUser)
        })
    });
}

const deleteUser = async (id) => {
    let q = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " +
        "RETURNING id, alias, email, last_name, img, second_last_name;";
    const params = [id]

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const deletedUser = results.rows[0];
            resolve(deletedUser)
        })
    });
}

const truncateTableTest = () => {
    const appIsBeingTested = process.env.NODE_ENV === 'test';

    // Only allow truncating table in test environment
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
            if (error) {
                reject(error)
            };


            resolve('Table ' + TABLE_NAME + ' truncated in test db.')
        }, true)
    });
};

const testDbSelectEverythingFromUserId = (id) => {
    const appIsBeingTested = process.env.NODE_ENV === 'test';

    // Only allow truncating table in test environment
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Nothing in ' + TABLE_NAME);
        });
    }

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
    selectUserByEmail,
    selectUserRegisteredByOAuth,
    updateUser,
    deleteUser,
    truncateTableTest,
    testDbSelectEverythingFromUserId,
};