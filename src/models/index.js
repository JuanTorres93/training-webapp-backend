// Import configured Sequelize instance
const sequelize = require("./sequelizeConfig.js");
// Import models
const UserModel = require("./user.model.js");
const SubscriptionModel = require("./subscription.model.js");

// Initialize models with the Sequelize instance
const Subscription = SubscriptionModel(sequelize);
const User = UserModel(sequelize, { SubscriptionModel: Subscription });

// Define model associations at ORM level
Subscription.hasMany(User, {
  foreignKey: "subscription_id",
  as: "users", // Alias for the association
});
User.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription", // Alias for the association
});

module.exports = {
  sequelize,
  User,
  Subscription,
};
