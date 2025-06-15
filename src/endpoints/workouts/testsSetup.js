// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require("dotenv").config();
const supertest = require("supertest");
const createApp = require("../../app.js");
const createCommonUser = require("../../createCommonUser.js").createCommonUser;

const actions = require("../../utils/test_utils/actions.js");
const app = createApp();
const BASE_ENDPOINT = "/workouts";
const { OTHER_USER_ALIAS } = require("../exercises/testsSetup.js");
const dbExercises = require("../../db/exercises.js");
const {
  newUserRequestNoOauth,
  newWorkoutRequest,
  benchPress,
  barbellRow,
  pullUp,
  dip,
  deadLift,
  squat,
  UUIDRegex,
} = require("../testCommon.js");

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

// TODO delete after refactor=?
const successfulPostRequest = {
  ...newWorkoutRequest,
};

const newUserReq = {
  ...newUserRequestNoOauth,
};

const createWorkoutRequest = {
  name: "workout_with_exercises",
  description: "This is the description for a workout with exercises",
};

const mandatoryWorkoutFields = ["template_id"];
const mandatoryAddExerciseFields = ["exerciseId", "exerciseSet"];

const assertWorkoutSwaggerSpec = (workout) => {
  expect(workout).toHaveProperty("id");
  expect(workout.id).toMatch(UUIDRegex);
  expect(workout).toHaveProperty("template_id");
  expect(workout.template_id).toMatch(UUIDRegex);
  expect(workout).toHaveProperty("name");
  expect(workout).toHaveProperty("description");
  expect(workout).toHaveProperty("exercises");
  expect(workout.exercises).toBeInstanceOf(Array);

  for (const exercise of workout.exercises) {
    expect(exercise).toHaveProperty("id");
    expect(exercise.id).toMatch(UUIDRegex);
    expect(exercise).toHaveProperty("name");
    expect(exercise).toHaveProperty("set");
    expect(exercise).toHaveProperty("reps");
    expect(exercise).toHaveProperty("weight");
    expect(exercise).toHaveProperty("time_in_seconds");
  }
};

const exercises = [benchPress, barbellRow, pullUp, dip, deadLift, squat];

const addWorkoutsAndExercises = async (userId, exercisesIds) => {
  // login user
  await actions.loginUser(request, newUserReq);

  // Create templates for the workouts
  const { template: pushTemplate } = await actions.createNewEmptyTemplate(
    request,
    {
      userId,
      name: "Push",
      description: "Push workout",
    }
  );

  const { template: pullTemplate } = await actions.createNewEmptyTemplate(
    request,
    {
      userId,
      name: "Pull",
      description: "Pull workout",
    }
  );

  const { template: legTemplate } = await actions.createNewEmptyTemplate(
    request,
    {
      userId,
      name: "Leg",
      description: "Leg workout",
    }
  );

  // Create some workouts
  const { response: pushResponse, workout: pushWorkout } =
    await actions.createNewWorkout(request, {
      template_id: pushTemplate.id,
      description: "Test push workout",
    });

  const { response: pullResponse, workout: pullWorkout } =
    await actions.createNewWorkout(request, {
      template_id: pullTemplate.id,
      description: "Test pull workout",
    });

  const { response: legResponse, workout: legWorkout } =
    await actions.createNewWorkout(request, {
      template_id: legTemplate.id,
      description: "Test leg workout",
    });

  // Add exercises to workouts
  // PUSH: bench press
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[0][0]],
    exerciseSet: 1,
    reps: 5,
    weight: 55,
    time_in_seconds: 0,
  });
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[0][0]],
    exerciseSet: 2,
    reps: 5,
    weight: 55,
    time_in_seconds: 0,
  });
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[0][0]],
    exerciseSet: 3,
    reps: 4,
    weight: 55,
    time_in_seconds: 0,
  });

  // PUSH: dip
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[3][0]],
    exerciseSet: 1,
    reps: 8,
    weight: 10,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[3][0]],
    exerciseSet: 2,
    reps: 8,
    weight: 10,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[3][0]],
    exerciseSet: 3,
    reps: 7,
    weight: 10,
    time_in_seconds: 0,
  });

  // PULL: barbell row
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[1][0]],
    exerciseSet: 1,
    reps: 9,
    weight: 75,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[1][0]],
    exerciseSet: 2,
    reps: 8,
    weight: 75,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[1][0]],
    exerciseSet: 3,
    reps: 8,
    weight: 75,
    time_in_seconds: 0,
  });

  // PULL: pull up
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[2][0]],
    exerciseSet: 1,
    reps: 6,
    weight: 12.5,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[2][0]],
    exerciseSet: 2,
    reps: 6,
    weight: 12.5,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[2][0]],
    exerciseSet: 3,
    reps: 6,
    weight: 12.5,
    time_in_seconds: 0,
  });

  // LEG: dead lift
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[4][0]],
    exerciseSet: 1,
    reps: 8,
    weight: 80,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[4][0]],
    exerciseSet: 2,
    reps: 8,
    weight: 80,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[4][0]],
    exerciseSet: 3,
    reps: 8,
    weight: 80,
    time_in_seconds: 0,
  });

  // LEG: squat
  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[5][0]],
    exerciseSet: 1,
    reps: 5,
    weight: 85,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[5][0]],
    exerciseSet: 2,
    reps: 5,
    weight: 85,
    time_in_seconds: 0,
  });

  await actions.addExerciseToWorkout(request, pushWorkout.id, {
    exerciseId: exercisesIds[exercises[5][0]],
    exerciseSet: 3,
    reps: 4,
    weight: 85,
    time_in_seconds: 0,
  });

  // logout user
  await actions.logoutUser(request);

  return {
    pushResponse,
    pushTemplate,
    pullResponse,
    legResponse,
  };
};

const getExercisesIds = async () => {
  const exercisesIds = {};

  // If solving all promises with Promise.all tests fail
  for (const exercise of exercises) {
    const name = exercise[0];

    let id;

    try {
      id = await dbExercises.selectIdForExerciseName(name, true);
    } catch (error) {
      throw error;
    }

    exercisesIds[name] = id;
  }

  return exercisesIds;
};

const setUp = async () => {
  await request.get(BASE_ENDPOINT + "/truncate");
  await request.get("/exercises/truncate");
  await request.get("/users/truncate");
  await request.get("/workouts/templates/truncate");

  // Add user to db
  const userReponse = await request.post("/users").send(newUserReq);
  const user = userReponse.body;

  // Add other user to db
  const otherUserResponse = await request.post("/users").send({
    ...newUserReq,
    username: OTHER_USER_ALIAS,
    email: "other@user.com",
  });
  const otherUser = otherUserResponse.body;

  await createCommonUser("", request);

  // login user
  await actions.loginUser(request, newUserReq);

  // logout user
  await actions.logoutUser(request);

  return { user, otherUser };
};

module.exports = {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  exercises,
  newUserReq,
  successfulPostRequest,
  createWorkoutRequest,
  request,
  mandatoryWorkoutFields,
  mandatoryAddExerciseFields,
  addWorkoutsAndExercises,
  getExercisesIds,
  setUp,
  assertWorkoutSwaggerSpec,
};
