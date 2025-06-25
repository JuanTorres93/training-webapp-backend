const { Pool } = require("pg");

// IMPORTANT! Changes in connection should also be reflected in models/sequelizeConfig.js
const commonPoolInfo = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_USER_PASSWORD,
  database: process.env.DB_NAME,
};

if (process.env.NODE_ENV === "test") {
  // For testing purposes, we set max connections to 1
  // It allows to avoid the error:
  //thrown: Object {
  //  "error": [error: sorry, too many clients already],
  //  "exists": null,
  //}
  commonPoolInfo.max = 1;
}

const notContainerizedPoolInfo = {
  ...commonPoolInfo,
  port: process.env.DB_PORT,

  // These 3 parameters below have allowed to connect to the database without errors
  idleTimeoutMillis: 10000,
  keepAlive: true,
  ssl: true,
};

if (process.env.DB_HOST === "db-test-for-frontend") {
  // For testing purposes. It prevents the error: The server does not support SSL connections
  delete notContainerizedPoolInfo.ssl;
}

let pool;

if (process.env.NODE_ENV === "test") {
  pool = new Pool({
    ...commonPoolInfo,
  });
} else if (
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
) {
  pool = new Pool({
    ...notContainerizedPoolInfo,
  });
} else {
  throw Error(
    `NODE_ENV must be test, development or production. Current value is ${process.env.NODE_ENV}`
  );
}

const getPool = () => {
  return pool;
};

module.exports = {
  getPool,
};
