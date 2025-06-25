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

const { sequelize, User, WorkoutTemplate } = require("../../models/index.js");

afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/last/{templateId}/user/{userId}", () => {
  let user, otherUser;
  let workout, template;
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

    template = createTemplate.template;

    await actions.addExerciseToExistingTemplate(request, template.id, {
      exerciseId: pushUp.id,
      exerciseOrder: 1,
      exerciseSets: 1,
    });

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

      beforeAll(async () => {
        // login user
        await actions.loginUser(request, newUserReq);

        const ep = BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`;

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
        const workout = response.body;
        assertWorkoutSwaggerSpec(workout);

        expect(workout.id).toStrictEqual(workout.id);
        expect(workout.template_id).toStrictEqual(template.id);
      });

      it("returns last workout", async () => {
        // Create new workout
        const createdNewWorkout = await actions.createNewWorkout(request, {
          template_id: template.id,
          description: "My second workout with this template",
        });

        const newWorkout = createdNewWorkout.workout;

        await actions.addExerciseToWorkout(request, newWorkout.id, {
          exerciseId: exercises.pushUp.id,
          exerciseSet: 1,
          reps: 10,
          weight: 0,
          time_in_seconds: 0,
        });

        // Get resposne
        const newResponse = await request.get(
          BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`
        );
        const newWorkoutData = newResponse.body;

        expect(newWorkoutData.id).toStrictEqual(newWorkout.id);
      });

      it("returns last workout from common template", async () => {
        const commonUser = await User.findOne({
          where: { email: process.env.DB_COMMON_USER_EMAIL },
        });

        // where user_id = commonUser.id and name includes "push"
        const commonTemplate = await WorkoutTemplate.findOne({
          where: {
            user_id: commonUser.id,
          },
        });

        // Create several workouts with common template
        for (let i = 0; i < 20; i++) {
          const commonWorkoutCreated = await actions.createNewWorkout(request, {
            template_id: commonTemplate.id,
            description: `My workout ${i} with common template`,
          });

          const commonWorkout = commonWorkoutCreated.workout;

          const commonResponse = await request.get(
            BASE_ENDPOINT + `/last/${commonTemplate.id}/user/${user.id}`
          );

          expect(commonResponse.body.id).toStrictEqual(commonWorkout.id);
        }
      });
    });

    describe("uphappy paths", () => {
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it("workoutId is not UUID", async () => {
          const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + `/last/TEST_PARAM/user/${user.id}`,
            "get"
          );
          await checkURLParamIsNotUUID();
        });

        it("userId is not UUID", async () => {
          const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + `/last/${template.id}/user/TEST_PARAM`,
            "get"
          );
          await checkURLParamIsNotUUID();
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`
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
            BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });

        it("trying to read another user's workout from common template", async () => {
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const commonUser = await User.findOne({
            where: { email: process.env.DB_COMMON_USER_EMAIL },
          });

          const commonTemplate = await WorkoutTemplate.findOne({
            where: {
              user_id: commonUser.id,
            },
          });

          const otherUserWorkout = await actions.createNewWorkout(request, {
            template_id: commonTemplate.id,
            description: "My workout with common template",
          });

          // logout user
          await actions.logoutUser(request);

          // login user
          await actions.loginUser(request, newUserReq);

          const response = await request.get(
            BASE_ENDPOINT + `/last/${commonTemplate.id}/user/${otherUser.id}`
          );

          expect(response.statusCode).toStrictEqual(403);

          // logout user
          await actions.logoutUser(request);
        });

        it("trying to read another user's template", async () => {
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/last/${template.id}/user/${otherUser.id}`
          );

          // logout user
          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("templateId is valid but workout with that id does not exist", async () => {
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          // generate a valid that probably won't exist UUID
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(
            BASE_ENDPOINT + `/last/${uuid}/user/${user.id}`
          );

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(404);
        });

        it("userId is valid but user with that id does not exist", async () => {
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          // generate a valid that probably won't exist UUID
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(
            BASE_ENDPOINT + `/last/${template.id}/user/${uuid}`
          );

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
