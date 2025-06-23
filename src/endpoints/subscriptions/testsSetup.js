// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const actions = require("../../utils/test_utils/actions.js");

const app = createApp();
const BASE_ENDPOINT = "/subscriptions";

const { newUserRequestNoOauth, UUIDRegex } = require("../testCommon.js");

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

const assertSubscriptionSpec = (subscription) => {
  expect(subscription).toHaveProperty("id");
  expect(subscription.id).toMatch(UUIDRegex);
  expect(subscription).toHaveProperty("type");
  expect(subscription.type).toBeDefined();
  expect(subscription.type).toMatch(/^[A-Z_]+$/);
  expect(subscription).toHaveProperty("description");
  expect(subscription.description).toBeDefined();
  expect(subscription).toHaveProperty("base_price_in_eur_cents");
  expect(subscription.base_price_in_eur_cents).toBeGreaterThanOrEqual(0);
  expect(subscription).toHaveProperty("name");
  expect(subscription.name).toBeDefined();
  expect(subscription).not.toHaveProperty("description_internal");
  expect(subscription).not.toHaveProperty("is_public");
};

const privateFields = ["description_internal", "is_public"];

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
  privateFields,
  assertSubscriptionSpec,
  setUp,
};
