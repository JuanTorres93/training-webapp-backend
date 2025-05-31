// Import configured Sequelize instance
const sequelize = require("./sequelizeConfig.js");
// Import models
const UserModel = require("./user.model.js");
const SubscriptionModel = require("./subscription.model.js");
const PaymentModel = require("./payment.model.js");
const WeightModel = require("./weight.model.js");

// Initialize models with the Sequelize instance
const Subscription = SubscriptionModel(sequelize);
const User = UserModel(sequelize, { SubscriptionModel: Subscription });
const Payment = PaymentModel(sequelize, {
  UserModel: User,
  SubscriptionModel: Subscription,
});
const Weight = WeightModel(sequelize, { UserModel: User });

// Define model associations at ORM level
// Users - Subscriptions
Subscription.hasMany(User, {
  foreignKey: "subscription_id",
  as: "users", // Alias for the association
});
User.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription", // Alias for the association
});

// Users - Payments
User.hasMany(Payment, {
  foreignKey: "user_id",
  as: "payments", // Alias for the association
});
Payment.belongsTo(User, {
  foreignKey: "user_id",
  as: "user", // Alias for the association
});

// Users - Weights
User.hasMany(Weight, {
  foreignKey: "user_id",
  as: "weights", // Alias for the association
});
Weight.belongsTo(User, {
  foreignKey: "user_id",
  as: "user", // Alias for the association
});

// Subscriptions - Payments
Subscription.hasMany(Payment, {
  foreignKey: "subscription_id",
  as: "payments", // Alias for the association
});
Payment.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription", // Alias for the association
});

module.exports = {
  sequelize,
  User,
  Subscription,
  Payment,
};
