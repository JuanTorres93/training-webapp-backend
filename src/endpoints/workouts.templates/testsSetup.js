// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const createCommonUser = require("../../createCommonUser.js").createCommonUser;
const {
  newUserRequestNoOauth,
  newExerciseRequest,
} = require("../testCommon.js");
const actions = require("../../utils/test_utils/actions.js");

const app = createApp();
const BASE_ENDPOINT = "/workouts/templates";
const OTHER_USER_ALIAS = "other user";
const TEMPLATE_AND_WORKOUT_NAME = "test_workout";

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const createNewTemplateRequest = (userId, name, description) => {
  return {
    userId,
    name,
    description,
  };
};

const newUserReq = {
  ...newUserRequestNoOauth,
};

const setUp = async () => {
  await request.get(BASE_ENDPOINT + "/truncate");
  await request.get("/users/truncate");
  await request.get("/exercises/truncate");
  await request.get("/workouts/truncate");

  // Add user to db
  const { user } = await actions.createNewUser(request, newUserReq);

  // Add other user to db
  const { otherUser } = await actions.createNewUser(request, {
    ...newUserReq,
    username: OTHER_USER_ALIAS,
    email: "other@user.com",
  });

  // DOC first parameter does nothing?
  await createCommonUser("", request);

  // login user
  await actions.loginUser(request, newUserReq);

  // Add template to db
  const reqNewTemplate = createNewTemplateRequest(
    user.id,
    TEMPLATE_AND_WORKOUT_NAME,
    "set up template description"
  );

  const { template: newTemplate } = await actions.createNewEmptyTemplate(
    request,
    reqNewTemplate
  );

  // Add exercise to db
  const { exercise: newExercise } = await actions.createNewExercise(
    request,
    newExerciseRequest
  );

  // Add exercise to template
  const reqAddExerciseToTemplate = {
    exerciseId: newExercise.id,
    exerciseOrder: 1,
    exerciseSets: 3,
  };
  const { exerciseInTemplate: newExerciseInTemplate } =
    await actions.addExerciseToExistingTemplate(
      request,
      newTemplate.id,
      reqAddExerciseToTemplate
    );

  // Add workout to db
  const { workout: newWorkout } = await actions.createNewWorkout(request, {
    template_id: newTemplate.id,
    description: "This is the description for a test workout",
  });

  // Add exercise to workout
  await actions.addExerciseToWorkout(request, newWorkout.id, {
    exerciseId: newExercise.id,
    exerciseSet: 1,
    reps: 3,
    weight: 40,
    time_in_seconds: 70,
  });

  // logout user
  await actions.logoutUser(request);

  return {
    user,
    otherUser,
    newTemplate,
    newExercise,
    newExerciseInTemplate,
    reqNewTemplate,
  };
};

module.exports = {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  TEMPLATE_AND_WORKOUT_NAME,
  request,
  newUserReq,
  createNewTemplateRequest,
  setUp,
};
