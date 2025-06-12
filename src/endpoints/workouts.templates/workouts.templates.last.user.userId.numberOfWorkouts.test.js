const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize, User } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(BASE_ENDPOINT + "/last/user/{userId}/{numberOfWorkouts}", () => {
  describe("get requests", () => {
    let user;
    let newTemplate;
    let newExercise;

    beforeAll(async () => {
      const setUpInfo = await setUp();

      user = setUpInfo.user;
      newTemplate = setUpInfo.newTemplate;
      newExercise = setUpInfo.newExercise;
    });

    describe("happy path", () => {
      let workout;
      beforeAll(async () => {
        // login user
        await actions.loginUser(request, newUserReq);

        // Add workout
        const workoutInfo = await actions.createNewWorkout(request, {
          template_id: newTemplate.id,
          description: "test workout",
        });
        workout = workoutInfo.workout;
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns array", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        expect(response.body).toBeInstanceOf(Array);
      });

      it("Objects of array have correct keys", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );

        for (const template of response.body) {
          expect(template).toHaveProperty("template_id");
          expect(template).toHaveProperty("workout_date");
          expect(template).toHaveProperty("workout_name");
        }
      });

      it("gets more recent workouts", async () => {
        // Get current last workout
        const responseExistingWorkout = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        const existingWorkout = responseExistingWorkout.body[0];
        expect(existingWorkout.workout_date).toBeDefined();

        // Create another workout
        await actions.createNewWorkout(request, {
          template_id: newTemplate.id,
          description: "another test workout",
        });

        const responseNewWorkout = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        const newWorkout = responseNewWorkout.body[0];

        expect(newWorkout.workout_date).toBeDefined();
        expect(newWorkout.workout_date).not.toBe(existingWorkout.workout_date);
        expect(new Date(newWorkout.workout_date).getTime()).toBeGreaterThan(
          new Date(existingWorkout.workout_date).getTime()
        );
      });

      it("returns workouts as a list where the first element is the most recent and goes progresively down", async () => {
        const numberOfWorkouts = 10;
        for (let i = 0; i < numberOfWorkouts; i++) {
          // 1 - Creates a new workout
          await actions.createNewWorkout(request, {
            template_id: newTemplate.id,
            description: `test workout ${i + 1}`,
          });

          // 2 - Gets the last 10 workouts
          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${numberOfWorkouts}`
          );
          expect(response.body.length).toBeLessThanOrEqual(numberOfWorkouts);
          expect(response.body.length).toBeGreaterThan(0);

          // 3 - Check that every next element is older than the previous one
          for (let j = 1; j < response.body.length; j++) {
            const previousWorkoutDate = new Date(
              response.body[j - 1].workout_date
            ).getTime();
            const currentWorkoutDate = new Date(
              response.body[j].workout_date
            ).getTime();
            expect(currentWorkoutDate).toBeLessThanOrEqual(previousWorkoutDate);
          }
        }
      });
    });

    describe("unhappy path", () => {
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it(
          "userId is not UUID",
          factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + `/last/user/TEST_PARAM/${1}`,
            "get"
          )
        );

        it(
          "numberOfWorkouts is not integer",
          factory.checkURLParamIsNotInteger(
            request,
            () => BASE_ENDPOINT + `/last/user/${user.id}/TEST_PARAM`,
            "get"
          )
        );

        it("numberOfWorkouts is lesser than 1", async () => {
          let response;
          response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${0}`
          );
          expect(response.statusCode).toStrictEqual(400);

          response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${-1}`
          );
          expect(response.statusCode).toStrictEqual(400);
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${1}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to read another user's recent workouts", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${1}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });

        it("trying to read common user's recent workouts", async () => {
          const commonUser = await User.findOne({
            where: { email: process.env.DB_COMMON_USER_EMAIL },
          });

          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${commonUser.id}/${1}`
          );

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("user with userId id does not exist", async () => {
          const response = await request.get(
            BASE_ENDPOINT +
              `/last/user/00000000-0000-0000-0000-000000000000/${1}`
          );
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
