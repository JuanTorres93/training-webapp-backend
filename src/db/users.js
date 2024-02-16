const { query } = require('./index');

const checkEmailInUse = async (email) => {
    const q = "SELECT email FROM users WHERE LOWER(email) = LOWER($1);";
    const params = [email];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(true);
            } else {
                reject(false);
            }
        });
    });
}

const checkAliasInUse = async (alias) => {
    const q = "SELECT alias FROM users WHERE LOWER(alias) = LOWER($1);";
    const params = [alias];

    // Must return a promise to be able to await when calling from another file
    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(true);
            } else {
                reject(false);
            }
        });
    });
}


module.exports = {
    checkEmailInUse,
    checkAliasInUse,
};