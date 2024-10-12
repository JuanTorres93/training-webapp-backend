const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_USER_PASSWORD,
    port: process.env.DB_PORT,
    // Other way to connect to the database. If want to use this way, comment the 5 lines above
    // connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`,

    // These 3 parameters below have allowed to connect to the database without errors
    idleTimeoutMillis: 10000,
    keepAlive: true,
    ssl: true,
});

const testPool = new Pool({
    user: process.env.DB_TEST_USER,
    host: process.env.DB_TEST_HOST,
    database: process.env.DB_TEST_NAME,
    password: process.env.DB_TEST_USER_PASSWORD,
    // port: process.env.DB_TEST_PORT,
});

const query = (text, params, callback, appIsBeingTested) => {
    // Example of using params. This is done instead of concatenating strings to prevent SQL injection
    // query("INSERT INTO customers (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)" ,
    //          [first_name, last_name, email, password],   // Values stored in variables
    //          (error, results) => {
    //              if (error) {
    //                  throw error
    //              }
    //          })

    if (appIsBeingTested === true || appIsBeingTested === false) {
        if (appIsBeingTested) return testPool.query(text, params, callback);

        return pool.query(text, params, callback);
    };

    throw Error(`appIsBeingTested must be true or false. Current value is ${appIsBeingTested}`);
};

/**
 * Retrieves a database connection client from the pool.
 * This method is intended to be used when needing to use transactions.
 *
 * @param {boolean} appIsBeingTested - Indicates whether the app is being tested.
 * @returns {Promise<object>} - A promise that resolves to a database connection client.
 * @throws {Error} - If appIsBeingTested is not a boolean value.
 */
const getPoolClient = async (appIsBeingTested) => {
    // DOCS for transactions: https://node-postgres.com/features/transactions
    if (appIsBeingTested === true || appIsBeingTested === false) {
        if (appIsBeingTested) return await testPool.connect();

        return await pool.connect();
    };

    throw Error(`appIsBeingTested must be true or false. Current value is ${appIsBeingTested}`);
};

/**
 * Retrieves the appropriate database connection pool based on the value of `appIsBeingTested`.
 *
 * @param {boolean} appIsBeingTested - Indicates whether the application is being tested.
 * @returns {Object} - The database connection pool.
 * @throws {Error} - If `appIsBeingTested` is not a boolean value.
 */
const getPool = (appIsBeingTested) => {
    if (appIsBeingTested === true || appIsBeingTested === false) {
        if (appIsBeingTested) return testPool;

        return pool;
    };

    throw Error(`appIsBeingTested must be true or false. Current value is ${appIsBeingTested}`);
};

module.exports = {
    query,
    getPool,
    getPoolClient,
};