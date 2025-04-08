const { query } = require("./index");
const qh = require("./queryHelper.js");

const TABLE_NAME = "payments";
const SELECT_PAYMENTS_FIELDS =
  "id, user_id, subscription_id, amount_in_eur, next_payment_date, created_at";

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
  const q = `select 
              ${SELECT_PAYMENTS_FIELDS}
             from ${TABLE_NAME}
             where user_id = $1
             order by next_payment_date desc
             limit 1;`;
  const params = [userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const lastPayment = results.rows[0];
      resolve(lastPayment);
    });
  });
};
