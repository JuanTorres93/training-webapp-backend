const { query } = require("./index");
const qh = require("./queryHelper.js");

const TABLE_NAME = "payments";
const SELECT_PAYMENTS_FIELDS =
  "id, user_id, subscription_id, amount_in_eur, next_payment_date, marked_for_cancel, created_at";

const queryLastPayment = `select 
                            ${SELECT_PAYMENTS_FIELDS}
                          from ${TABLE_NAME}
                          where user_id = $1
                          and next_payment_date is not NULL
                          order by created_at desc
                          limit 1;`;

exports.createPayment = async ({
  userId,
  subscriptionId,
  amountInEur,
  nextPaymentDate,
  stripeSubscriptionId,
}) => {
  // Build query
  let requiredFields = [
    "user_id",
    "subscription_id",
    "amount_in_eur",
    "next_payment_date",
    "created_at",
    "stripe_subscription_id",
  ];
  let requiredValues = [
    userId,
    subscriptionId,
    amountInEur,
    nextPaymentDate,
    new Date(),
    stripeSubscriptionId,
  ];

  let optionalFields = [];
  let optionalValues = [];

  let returningFields = ["id"];

  const { q, params } = qh.createInsertIntoTableStatement(
    TABLE_NAME,
    requiredFields,
    requiredValues,
    optionalFields,
    optionalValues,
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const createdPayment = results.rows[0];
      resolve(createdPayment);
    });
  });
};

exports.getUserLastPayment = async (userId) => {
  const q = queryLastPayment;
  const params = [userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const lastPayment = results.rows[0];
      resolve(lastPayment);
    });
  });
};

exports.getUserStripeSubscriptionId = async (userId) => {
  const q = queryLastPayment.replace(
    SELECT_PAYMENTS_FIELDS,
    "stripe_subscription_id"
  );
  const params = [userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const stripeSubscriptionId = results.rows[0].stripe_subscription_id
        ? results.rows[0].stripe_subscription_id
        : null;
      resolve(stripeSubscriptionId);
    });
  });
};

exports.markStripeSubscriptionAsCancelled = async (stripeSubscriptionId) => {
  // Mark last payment as cancelled
  const q = `UPDATE ${TABLE_NAME} 
            SET marked_for_cancel = true
            WHERE stripe_subscription_id = $1
            AND created_at = (
              SELECT MAX(created_at) 
              FROM ${TABLE_NAME} 
              WHERE stripe_subscription_id = $1
            );`;
  const params = [stripeSubscriptionId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
};
