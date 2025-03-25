const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to DB has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

const db = {};
db.sequelize = sequelize;
db.DataTypes = DataTypes;

// Importar modelos
db.Subscription = require("./models/subscriptionModel")(sequelize, DataTypes);
db.User = require("./models/userModel")(sequelize, DataTypes);

module.exports = db;
