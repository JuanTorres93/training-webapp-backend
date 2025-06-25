const { sequelize: regularSequelize, DataTypes } = require("sequelize");

const TABLE_NAME = "payments";
const SELECT_PAYMENTS_FIELDS =
  "id, user_id, subscription_id, amount_in_eur, next_payment_date, marked_for_cancel, created_at";

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
      tableName: TABLE_NAME, // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  Payment.markForCancel = async function (stripeSubscriptionId, flag) {
    // flag is true or false
    const q = `UPDATE ${TABLE_NAME} 
               SET marked_for_cancel = :flag
               WHERE stripe_subscription_id = :stripeSubscriptionId
               AND created_at = (
                 SELECT MAX(created_at) 
                 FROM ${TABLE_NAME} 
                 WHERE stripe_subscription_id = :stripeSubscriptionId
               );`;

    await sequelize.query(q, {
      replacements: { stripeSubscriptionId, flag },
      // type: regularSequelize.QueryTypes.UPDATE,
    });
  };

  Payment.findLastPayment = async function (userId) {
    const q = `SELECT 
             ${SELECT_PAYMENTS_FIELDS}
           FROM ${TABLE_NAME}
           WHERE user_id = :userId
           --AND next_payment_date IS NOT NULL 
           ORDER BY created_at desc
           LIMIT 1;`;

    const [results] = await sequelize.query(q, {
      replacements: { userId },
      type: regularSequelize.QueryTypes.SELECT,
    });

    // TODO Check actual results
    if (results.length === 0) {
      return null;
    }
    return results[0];
  };

  Payment.findUserStripeSubscriptionId = async function (userId) {
    const lastPayment = await Payment.findLastPayment(userId);
    if (!lastPayment) {
      return null;
    }
    return lastPayment.stripe_subscription_id || null;
  };

  return Payment;
};
