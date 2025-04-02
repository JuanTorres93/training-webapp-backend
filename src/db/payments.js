const { query } = require("./index");
const qh = require("./queryHelper.js");

const TABLE_NAME = "payments";

exports.createPayment = async ({
  userId,
  subscriptionId,
  amountInEur,
  nextPaymentDate,
}) => {
  // Build query
  let requiredFields = [
    "user_id",
    "subscription_id",
    "amount_in_eur",
    "next_payment_date",
    "created_at",
  ];
  let requiredValues = [
    userId,
    subscriptionId,
    amountInEur,
    nextPaymentDate,
    new Date(),
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
