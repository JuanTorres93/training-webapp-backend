const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  exercises,
  addWorkoutsAndExercises,
  assertExerciseInWorkoutSwaggerSpec,
  getExercisesIds,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(
  `${BASE_ENDPOINT}` + "/{workoutId}/exercises/{exerciseId}/{exerciseSet}",
  () => {
    describe("delete requests", () => {
      let user;
      let workout;
      let exerciseToDelete;
      let exercisesIds = {};

      beforeAll(async () => {
        // Test's set up
        const setupInfo = await setUp();
        user = setupInfo.user;
        await actions.fillExercisesTable(request, newUserReq, exercises);

        try {
          exercisesIds = await getExercisesIds();
        } catch (error) {
          console.log(error);
        }

        const { pushResponse } = await addWorkoutsAndExercises(
          user.id,
          exercisesIds
        );
        const workoutId = pushResponse.body.id;

        // login user
        await actions.loginUser(request, newUserReq);

        workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
        workout = workout.body;
        exerciseToDelete = workout.exercises[0];

        // logout user
        await actions.logoutUser(request);
      });

      describe("unhappy path", () => {
        beforeAll(async () => {
          // Ensure user is logged out
          await actions.loginUser(request, newUserReq);
          await actions.logoutUser(request);
        });

        describe("returns 400 error code when", () => {
          it("workoutId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT +
                `/TEST_PARAM` +
                `/exercises/${exerciseToDelete.id}/1`,
              "delete"
            );

            await checkURLParamIsNotUUID();
          });

          it("exerciseId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT + `/${workout.id}` + `/exercises/TEST_PARAM/1`,
              "delete"
            );

            await checkURLParamIsNotUUID();
          });

          it("exerciseSet is not positive integer", async () => {
            const checkURLParamIsNotPositiveInteger =
              factory.checkURLParamIsNotInteger(
                request,
                BASE_ENDPOINT +
                  `/${workout.id}` +
                  `/exercises/${exerciseToDelete.id}/TEST_PARAM`,
                "delete"
              );

            await checkURLParamIsNotPositiveInteger();
          });
        });

        describe("401 response when", () => {
          it("user is not logged in", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}/exercises/${exerciseToDelete.id}/1`
            );
            expect(response.statusCode).toStrictEqual(401);
          });
        });

        describe("403 response when", () => {
          it("trying to delete exercise on another user's workout", async () => {
            // login other user
            await actions.loginUser(request, {
              username: OTHER_USER_ALIAS,
              password: newUserReq.password,
            });

            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}/exercises/${exerciseToDelete.id}/1`
            );

            // logout user
            await actions.logoutUser(request);
            expect(response.statusCode).toStrictEqual(403);
          });
        });

        describe("404 response when", () => {
          it("workoutid is valid but workout with that id does not exist", async () => {
            // valid UUID that is unlikely to be in the db
            const uuid = "00000000-0000-0000-0000-000000000000";
            const response = await request.delete(
              BASE_ENDPOINT + "/" + uuid + `/exercises/${exerciseToDelete.id}/1`
            );
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseId is valid but exercise with that id does not exist", async () => {
            // Valid UUID but (probably) not existing in the database
            const uuid = "00000000-0000-0000-0000-000000000000";
            const response = await request.delete(
              BASE_ENDPOINT + `/${workout.id}` + `/exercises/${uuid}/1`
            );
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseSet is valid but exercise with that set does not exist", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}` +
                `/exercises/${exerciseToDelete.id}/1111`
            );

            expect(response.statusCode).toStrictEqual(404);
          });
        });
      });

      describe("happy path", () => {
        let response;

        beforeAll(async () => {
          // login user
          await actions.loginUser(request, newUserReq);

          response = await request.delete(
            BASE_ENDPOINT + `/${workout.id}/exercises/${exerciseToDelete.id}/1`
          );
        });

        afterAll(async () => {
          // logout user
          await actions.logoutUser(request);
        });

        it("status code of 200", async () => {
          expect(response.statusCode).toStrictEqual(200);
        });

        it("returns deleted exercise", () => {
          const deletedExercise = response.body;

          assertExerciseInWorkoutSwaggerSpec(deletedExercise);

          expect(deletedExercise.exerciseId).toStrictEqual(exerciseToDelete.id);
          expect(deletedExercise.exerciseSet).toStrictEqual(
            exerciseToDelete.set
          );
          expect(deletedExercise.reps).toStrictEqual(exerciseToDelete.reps);
          expect(deletedExercise.weight).toStrictEqual(exerciseToDelete.weight);
          expect(deletedExercise.time_in_seconds).toStrictEqual(
            exerciseToDelete.time_in_seconds
          );
        });
      });
    });
  }
);
