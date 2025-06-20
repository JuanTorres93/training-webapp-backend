const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  assertWorkoutSwaggerSpec,
  setUp,
} = require("./testsSetup.js");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize, UserWorkouts } = require("../../models/index.js");

afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/addFinishDate/{workoutId}", () => {
  let user, otherUser;
  let workout;
  const exercises = {};

  beforeAll(async () => {
    // Test's set up
    const setupInfo = await setUp();

    user = setupInfo.user;
    otherUser = setupInfo.otherUser;

    // login user
    await actions.loginUser(request, newUserReq);

    // Create exercises in the database
    const { exercise: pushUp } = await actions.createNewExercise(request, {
      name: "Push Up",
      description: "A basic push up exercise",
    });

    exercises.pushUp = pushUp;

    // Create template
    const createTemplate = await actions.createNewEmptyTemplate(request, {
      userId: user.id,
      name: "Full Body Workout",
      description: "A full body workout template",
    });

    await actions.addExerciseToExistingTemplate(
      request,
      createTemplate.template.id,
      {
        exerciseId: pushUp.id,
        exerciseOrder: 1,
        exerciseSets: 1,
      }
    );

    // Create workout
    const createdWorkout = await actions.createNewWorkout(request, {
      template_id: createTemplate.template.id,
      description: "My first workout with this template",
    });

    workout = createdWorkout.workout;

    await actions.addExerciseToWorkout(request, workout.id, {
      exerciseId: pushUp.id,
      exerciseSet: 1,
      reps: 10,
      weight: 0,
      time_in_seconds: 0,
    });

    // logout user
    await actions.logoutUser(request);
  });

  describe("get requests", () => {
    beforeAll(async () => {});

    describe("happy path", () => {
      let response;
      let initialWorkout;

      beforeAll(async () => {
        // login user
        await actions.loginUser(request, newUserReq);

        initialWorkout = await UserWorkouts.findOne({
          where: {
            user_id: user.id,
            workout_id: workout.id,
          },
        });

        const ep = BASE_ENDPOINT + `/addFinishDate/${workout.id}`;

        response = await request.get(ep);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("returns 200 status code", async () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns a workout", async () => {
        assertWorkoutSwaggerSpec(response.body);
      });

      it("adds finish date in DB", async () => {
        const updatedWorkout = await UserWorkouts.findOne({
          where: {
            user_id: user.id,
            workout_id: workout.id,
          },
          attributes: ["end_date"],
        });

        expect(initialWorkout.end_date).toBeNull();
        expect(updatedWorkout.end_date).toBeDefined();
      });
    });

    describe("uphappy paths", () => {
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it(
          "workoutId is not UUID",
          factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + "/addFinishDate/TEST_PARAM",
            "get"
          )
        );
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/addFinishDate/${workout.id}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to read another user's workout", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/addFinishDate/${workout.id}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("workoutId is valid but workout with that id does not exist", async () => {
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          // generate a valid that probably won't exist UUID
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(
            BASE_ENDPOINT + "/addFinishDate/" + uuid
          );

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
