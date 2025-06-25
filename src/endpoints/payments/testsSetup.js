// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const actions = require("../../utils/test_utils/actions.js");

const app = createApp();
const BASE_ENDPOINT = "/payments";

const {
  newUserRequestNoOauth,
  UUIDRegex,
  dateTimeRegex,
} = require("../testCommon.js");

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const newUserReq = {
  ...newUserRequestNoOauth,
};

const assertPaymentSpec = (payment) => {
  expect(payment).toHaveProperty("id");
  expect(payment.id).toMatch(UUIDRegex);
  expect(payment).toHaveProperty("user_id");
  expect(payment.user_id).toMatch(UUIDRegex);
  expect(payment).toHaveProperty("subscription_id");
  expect(payment.subscription_id).toMatch(UUIDRegex);
  expect(payment).toHaveProperty("amount_in_eur");
  expect(payment.amount_in_eur).toBeGreaterThanOrEqual(0);
  expect(payment).toHaveProperty("stripe_subscription_id");
  expect(payment).toHaveProperty("marked_for_cancel");
  // follow format: "2023-10-01T00:00:00.000Z"
  expect(payment).toHaveProperty("next_payment_date");
  expect(payment.next_payment_date).toMatch(dateTimeRegex);
  expect(payment).toHaveProperty("created_at");
  expect(payment.created_at).toMatch(dateTimeRegex);
};

const setUp = async () => {
  // Empty database before starting tests
  await request.get("/users/truncate");
  await request.get(BASE_ENDPOINT + "/truncate");

  // Add user to db
  const { user: newUser } = await actions.createNewUser(request, newUserReq);

  // Add another user to db
  const { user: otherUser } = await actions.createNewUser(request, {
    ...newUserReq,
    username: "other",
    email: "other@domain.com",
  });

  return {
    newUser,
    otherUser,
  };
};

module.exports = {
  request,
  BASE_ENDPOINT,
  newUserReq,
  assertPaymentSpec,
  setUp,
};
