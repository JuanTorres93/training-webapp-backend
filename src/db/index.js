// TODO all calls to database should be async?
const { Pool } = require('pg');
  
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_USER_PASSWORD,
    port: process.env.DB_PORT,
    // These 3 parameters below have allowed to connect to the database without errors
    idleTimeoutMillis: 10000,
    keepAlive: true,
    ssl: true,
});
 
const query = (text, params, callback) => {
    // Example of using params. This is done instead of concatenating strings to prevent SQL injection
    // query("INSERT INTO customers (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)" ,
    //          [first_name, last_name, email, password],   // Values stored in variables
    //          (error, results) => {
    //              if (error) {
    //                  throw error
    //              }
    //          })
	
    return pool.query(text, params, callback)
};

module.exports = {
    query,
};