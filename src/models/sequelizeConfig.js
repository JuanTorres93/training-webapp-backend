const { Sequelize } = require("sequelize");

// IMPORTANT! Changes in connection should also be reflected in db/index.js Dockerfile
let config = {
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PASSWORD,
  database: process.env.DB_NAME,
  logging: false, // Disable logging for cleaner output
};

const notTestEnvironment = {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: process.env.NODE_ENV === "production", // Only reject unauthorized in production
    },
  },
};

if (process.env.NODE_ENV !== "test") {
  config = {
    ...config,
    ...notTestEnvironment,
  };
}

// Initialize Sequelize
const sequelize = new Sequelize(config);

module.exports = sequelize;
