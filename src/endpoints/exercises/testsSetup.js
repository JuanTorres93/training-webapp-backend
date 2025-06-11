// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const {
  newUserRequestNoOauth,
  newExerciseRequest,
} = require("../testCommon.js");
const actions = require("../../utils/test_utils/actions.js");
const createCommonUser = require("../../createCommonUser.js").createCommonUser;

const app = createApp();
const BASE_ENDPOINT = "/exercises";
OTHER_USER_ALIAS = "other user";

const successfulPostRequest = {
  ...newExerciseRequest,
};

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

const expectedExerciseProperties = ["id", "name", "description"];

const setUp = async () => {
  await request.get(BASE_ENDPOINT + "/truncate");
  await request.get("/users/truncate");

  // Add user to db
  const { user: newUser } = await actions.createNewUser(request, newUserReq);

  // Add other user to db
  const { user: otherUser } = await actions.createNewUser(request, {
    ...newUserReq,
    username: OTHER_USER_ALIAS,
    email: "other@user.com",
  });

  // Create common user and his resources
  await createCommonUser("", request);

  // login user
  await actions.loginUser(request, newUserReq);

  // Add exercise to db
  const { exercise: newExercise } = await actions.createNewExercise(
    request,
    successfulPostRequest
  );

  // logout user
  await actions.logoutUser(request);

  return {
    newUser,
    newExercise,
    otherUser,
  };
};

module.exports = {
  OTHER_USER_ALIAS,
  request,
  BASE_ENDPOINT,
  newUserReq,
  successfulPostRequest,
  expectedExerciseProperties,
  setUp,
};
