// This info is obtained from the database 
// (see documentation_future_reference/db_creation.sql and db_role_connection.sql)
// IMPORTANT: IN A REAL APPLICATION THIS INFO MUSTN'T BE EXPOSED!!

const USER = 'dbuser';
const HOST = 'localhost';
const DATABASE = 'ecommerce';
const PASSWORD = 'super_secure_password';
const PORT = 5432;

module.exports = {
    USER,
    HOST,
    DATABASE,
    PASSWORD,
    PORT,
};