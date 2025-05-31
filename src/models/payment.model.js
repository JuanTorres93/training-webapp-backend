const { DataTypes } = require("sequelize");

module.exports = (sequelize, { UserModel, SubscriptionModel }) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: UserModel,
          key: "id",
        },
      },
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: SubscriptionModel,
          key: "id",
        },
      },
      amount_in_eur: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      next_payment_date: {
        type: DataTypes.DATE,
      },
      stripe_subscription_id: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      marked_for_cancel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "payments", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  return Payment;
};
