// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const actions = require("../../utils/test_utils/actions.js");

const app = createApp();
const BASE_ENDPOINT = "/users";

const { newUserRequestNoOauth } = require("../testCommon.js");

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const successfulPostRequest = {
  ...newUserRequestNoOauth,
};

const setUp = async () => {
  // Empty database before starting tests
  await request.get(BASE_ENDPOINT + "/truncate");

  // Add user to db
  const { user: newUser } = await actions.createNewUser(
    request,
    successfulPostRequest
  );

  // Add another user to db
  const { user: otherUser } = await actions.createNewUser(request, {
    ...successfulPostRequest,
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
  successfulPostRequest,
  setUp,
};
