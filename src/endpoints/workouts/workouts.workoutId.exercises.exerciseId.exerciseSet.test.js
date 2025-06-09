const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  initExercisesTableInDb,
  addWorkoutsAndExercises,
  getExercisesIds,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

describe(
  `${BASE_ENDPOINT}` + "/{workoutId}/exercises/{exerciseId}/{exerciseSet}",
  () => {
    describe("delete requests", () => {
      let user;
      let workout;
      let initialExercise;
      let exercisesIds = {};

      beforeAll(async () => {
        // Test's set up
        const setupInfo = await setUp();
        user = setupInfo.user;
        await initExercisesTableInDb();

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
        initialExercise = workout.exercises[0];

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
          it("exerciseset is string", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}` +
                `/exercises/${initialExercise.id}/wrongId`
            );
            expect(response.statusCode).toStrictEqual(400);
          });

          it("exerciseset is boolean", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}` +
                `/exercises/${initialExercise.id}/true`
            );
            expect(response.statusCode).toStrictEqual(400);
          });

          it("exerciseset is not positive", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${workout.id}` +
                `/exercises/${initialExercise.id}/-23`
            );
            expect(response.statusCode).toStrictEqual(400);
          });
        });

        describe("401 response when", () => {
          it("user is not logged in", async () => {
            const response = await request.delete(
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
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
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
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
              BASE_ENDPOINT + "/" + uuid + `/exercises/${initialExercise.id}/1`
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
                `/exercises/${initialExercise.id}/1111`
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
            BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
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

          expect(deletedExercise.exerciseId).toStrictEqual(initialExercise.id);
          expect(deletedExercise.exerciseSet).toStrictEqual(
            initialExercise.set
          );
          expect(deletedExercise.reps).toStrictEqual(initialExercise.reps);
          expect(deletedExercise.weight).toStrictEqual(initialExercise.weight);
          expect(deletedExercise.time_in_seconds).toStrictEqual(
            initialExercise.time_in_seconds
          );
        });
      });
    });
  }
);
