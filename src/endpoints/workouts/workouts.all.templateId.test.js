const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  setUp,
} = require("./testsSetup.js");
const actions = require("../../utils/test_utils/actions.js");
const { UUIDRegex } = require("../testCommon.js");

const { sequelize, User, WorkoutTemplate } = require("../../models/index.js");

afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/all/{templateId}", () => {
  let user, otherUser;
  let template;
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

    const { exercise: squat } = await actions.createNewExercise(request, {
      name: "Squat",
      description: "A basic squat exercise",
    });

    exercises.pushUp = pushUp;
    exercises.squat = squat;

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

    await actions.addExerciseToExistingTemplate(
      request,
      createTemplate.template.id,
      {
        exerciseId: squat.id,
        exerciseOrder: 2,
        exerciseSets: 1,
      }
    );

    template = createTemplate.template;

    // Create workout
    await actions.createNewWorkout(request, {
      template_id: template.id,
      description: "My first workout with this template",
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

        const ep = BASE_ENDPOINT + `/all/${template.id}`;

        response = await request.get(ep);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("returns 200 status code", async () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns a list", async () => {
        expect(Array.isArray(response.body)).toBe(true);
      });

      it("list contains workouts ids", async () => {
        const workouts = response.body;

        expect(workouts.length).toBeGreaterThan(0);
        workouts.forEach((workout) => {
          expect(workout).toHaveProperty("workout_id");
          expect(workout.workout_id).toMatch(UUIDRegex);
        });
      });

      it("list is updated with new workout creation", async () => {
        await actions.createNewWorkout(request, {
          template_id: template.id,
          description: "My second workout with this template",
        });

        const updatedResponse = await request.get(
          BASE_ENDPOINT + `/all/${template.id}`
        );
        expect(updatedResponse.statusCode).toStrictEqual(200);
        expect(updatedResponse.body.length).toBe(response.body.length + 1);
      });

      it("it selects workouts from common templates", async () => {
        const commonUser = await User.findOne({
          where: { email: process.env.DB_COMMON_USER_EMAIL },
        });

        const commonTemplate = await WorkoutTemplate.findOne({
          where: { user_id: commonUser.id },
        });

        await actions.createNewWorkout(request, {
          template_id: commonTemplate.id,
          description: "My first workout with common template",
        });

        const responseCommon = await request.get(
          BASE_ENDPOINT + `/all/${commonTemplate.id}`
        );

        expect(responseCommon.statusCode).toStrictEqual(200);
        expect(responseCommon.body.length).toStrictEqual(1);
      });

      it("it does not select other user's workouts from common template", async () => {
        // Find common template
        const commonUser = await User.findOne({
          where: { email: process.env.DB_COMMON_USER_EMAIL },
        });

        const commonTemplate = await WorkoutTemplate.findOne({
          where: { user_id: commonUser.id },
        });

        // Create a workout with common template
        await actions.createNewWorkout(request, {
          template_id: commonTemplate.id,
          description: "user common template",
        });

        // Check that other user cannot see the workout
        await actions.logoutUser(request);

        await actions.loginUser(request, {
          username: OTHER_USER_ALIAS,
          password: newUserReq.password,
        });

        let responseOtherUser = await request.get(
          BASE_ENDPOINT + `/all/${commonTemplate.id}`
        );

        expect(responseOtherUser.statusCode).toStrictEqual(200);
        expect(responseOtherUser.body.length).toStrictEqual(0);

        // Check that other user can create a workout with common template and
        // see it afterwards
        await actions.createNewWorkout(request, {
          template_id: commonTemplate.id,
          description: "other user common template",
        });

        responseOtherUser = await request.get(
          BASE_ENDPOINT + `/all/${commonTemplate.id}`
        );

        expect(responseOtherUser.statusCode).toStrictEqual(200);
        expect(responseOtherUser.body.length).toStrictEqual(1);

        await actions.logoutUser(request);
      });
    });

    describe("uphappy paths", () => {
      // TODO IMPORTANT: Mirar estos tests. No los he modificado desde que copié el archivo
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it(
          "templateId is not UUID",
          factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + "/all/TEST_PARAM",
            "get"
          )
        );
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/all/${template.id}`
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
            BASE_ENDPOINT + `/all/${template.id}`
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
          const response = await request.get(BASE_ENDPOINT + "/all/" + uuid);

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
