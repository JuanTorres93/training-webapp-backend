const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  exercises,
  addWorkoutsAndExercises,
  getExercisesIds,
  setUp,
  assertExerciseInWorkoutSwaggerSpec,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/{workoutId}/exercises/{exerciseId}", () => {
  let workout;
  let initialExercise;
  let exercisesIds = {};

  beforeAll(async () => {
    // Test's set up
    const setupInfo = await setUp();
    const { user } = setupInfo;
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

    initialExercise = workout.exercises[0];

    // logout user
    await actions.logoutUser(request);
  });

  describe("put requests", () => {
    let user;

    describe("happy path", () => {
      beforeEach(async () => {
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

        // login user. HERE BECAUSE PREVIOUS CALLS LOGOUT THE USER
        await actions.loginUser(request, newUserReq);

        workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
        workout = workout.body;
        initialExercise = workout.exercises[0];

        // logout user
        await actions.logoutUser(request);
      });

      it("updates params individually", async () => {
        const params = ["reps", "weight", "time_in_seconds"];
        await actions.loginUser(request, newUserReq);

        params.forEach(async (p) => {
          // Random integer
          const randomValue = Math.floor(Math.random() * 100) + 1;

          const body = {
            exerciseSet: 1, // Required field
            [p]: randomValue,
          };

          const response = await request
            .put(
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
            )
            .send(body);

          assertExerciseInWorkoutSwaggerSpec(response.body);
          expect(response.statusCode).toStrictEqual(200);
          expect(response.body[p]).toStrictEqual(randomValue);
        });

        await actions.logoutUser(request);
      });
    });

    describe("unhappy path", () => {
      const req = {
        exerciseSet: 1,
        reps: 34,
      };

      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("returns 400 error code when", () => {
        it("workoutId is not UUID", async () => {
          const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + "/TEST_PARAM" + `/exercises/${initialExercise.id}`,
            "put",
            req
          );

          await checkURLParamIsNotUUID();
        });

        it("exerciseId is not UUID", async () => {
          const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + `/${workout.id}` + `/exercises/TEST_PARAM`,
            "put",
            req
          );

          await checkURLParamIsNotUUID();
        });

        it("exerciseSet is missing in body request", async () => {
          const wrongBody = {
            reps: 34,
            weight: 50,
            time_in_seconds: 60,
          };

          const response = await request
            .put(
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
            )
            .send(wrongBody);
          expect(response.statusCode).toStrictEqual(400);
        });

        it("exerciseSet is not integer greater than 0", async () => {
          const wrongExerciseSet = [
            "notAnInteger",
            1.5,
            -1,
            true,
            false,
            null,
            // undefined, // NOTE: it can be undefined if it's missing since it is not required
            "123abc",
            "123; DROP TABLE users;",
            "123,456", // float with comma
            "123.456", // float with decimal
            "123.456abc", // alphanumeric
          ];

          for (const wrongValue of wrongExerciseSet) {
            const wrongBody = {
              exerciseSet: wrongValue,
              reps: 10,
              weight: 50,
              time_in_seconds: 60,
            };

            await actions.loginUser(request, newUserReq);

            const response = await request
              .put(
                BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
              )
              .send(wrongBody);

            await actions.logoutUser(request);

            expect(response.statusCode).toStrictEqual(400);
          }
        });

        it("reps is not integer", async () => {
          const wrongReps = [
            "notAnInteger",
            1.5,
            -1,
            true,
            false,
            null,
            // undefined, // NOTE: it can be undefined if it's missing since it is not required
            "123abc",
            "123; DROP TABLE users;",
            "123,456", // float with comma
            "123.456", // float with decimal
            "123.456abc", // alphanumeric
          ];

          for (const wrongValue of wrongReps) {
            const wrongBody = {
              exerciseSet: 1,
              reps: wrongValue,
              weight: 50,
              time_in_seconds: 60,
            };

            await actions.loginUser(request, newUserReq);

            const response = await request
              .put(
                BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
              )
              .send(wrongBody);

            await actions.logoutUser(request);

            expect(response.statusCode).toStrictEqual(400);
          }
        });

        it("weight is not a positive number", async () => {
          const wrongWeight = [
            "notAPositiveNumber",
            -1,
            true,
            false,
            null,
            // undefined, // NOTE: it can be undefined if it's missing since it is not required
            "123abc",
            "123; DROP TABLE users;",
            "123,456", // float with comma
            "123.456abc", // alphanumeric
          ];
          for (const wrongValue of wrongWeight) {
            const wrongBody = {
              exerciseSet: 1,
              reps: 10,
              weight: wrongValue,
              time_in_seconds: 60,
            };

            await actions.loginUser(request, newUserReq);

            const response = await request
              .put(
                BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
              )
              .send(wrongBody);

            await actions.logoutUser(request);

            expect(response.statusCode).toStrictEqual(400);
          }
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request
            .put(
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
            )
            .send(req);
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to update exercise on another user's workout", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const req = {
            exerciseSet: 1,
            reps: 88,
          };

          const response = await request
            .put(
              BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
            )
            .send(req);

          // logout user
          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("workoutid is valid but workout with that id does not exist", async () => {
          // valid UUID that is unlikely to be in the db
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request
            .put(
              BASE_ENDPOINT + "/" + uuid + `/exercises/${initialExercise.id}`
            )
            .send(req);
          expect(response.statusCode).toStrictEqual(404);
        });

        it("exerciseId is valid but exercise with that id does not exist", async () => {
          // Valid UUID but (probably) not existing in the database
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request
            .put(BASE_ENDPOINT + `/${workout.id}` + `/exercises/` + uuid)
            .send(req);
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });

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
            BASE_ENDPOINT + "/TEST_PARAM" + `/exercises/${exerciseToDelete.id}`,
            "delete"
          );

          await checkURLParamIsNotUUID();
        });

        it("exerciseId is not UUID", async () => {
          const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + `/${workout.id}` + `/exercises/TEST_PARAM`,
            "delete"
          );

          await checkURLParamIsNotUUID();
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.delete(
            BASE_ENDPOINT + `/${workout.id}/exercises/${exerciseToDelete.id}`
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
            BASE_ENDPOINT + `/${workout.id}/exercises/${exerciseToDelete.id}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        // valid UUID that is unlikely to be in the db
        const uuid = "00000000-0000-0000-0000-000000000000";
        it("workoutid is valid but workout with that id does not exist", async () => {
          const response = await request.delete(
            BASE_ENDPOINT + "/" + uuid + `/exercises/${exerciseToDelete.id}`
          );
          expect(response.statusCode).toStrictEqual(404);
        });

        it("exerciseId is valid but exercise with that id does not exist", async () => {
          // Valid UUID but (probably) not existing in the database
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.delete(
            BASE_ENDPOINT + `/${workout.id}` + `/exercises/` + uuid
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
          BASE_ENDPOINT + `/${workout.id}/exercises/${exerciseToDelete.id}`
        );
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", async () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns array of exercises", async () => {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(1);

        for (const exercise of response.body) {
          assertExerciseInWorkoutSwaggerSpec(exercise);
        }
      });

      it("returns deleted exercise", () => {
        const deletedExercise = response.body[0];

        expect(deletedExercise.exerciseId).toStrictEqual(exerciseToDelete.id);
        expect(deletedExercise.exerciseSet).toStrictEqual(exerciseToDelete.set);
        expect(deletedExercise.reps).toStrictEqual(exerciseToDelete.reps);
        expect(deletedExercise.weight).toStrictEqual(exerciseToDelete.weight);
        expect(deletedExercise.time_in_seconds).toStrictEqual(
          exerciseToDelete.time_in_seconds
        );
      });

      it("returns array when only one set exists", async () => {
        await actions.loginUser(request, newUserReq);

        // previous delete should have deleted the exercise
        const workoutResponse = await request.get(
          BASE_ENDPOINT + `/${workout.id}`
        );
        workout = workoutResponse.body;
        const existingExercisesIds = workout.exercises.map(
          (exercise) => exercise.id
        );
        expect(existingExercisesIds).not.toContain(exerciseToDelete.id);

        await actions.addExerciseToWorkout(request, workout.id, {
          exerciseId: exerciseToDelete.id,
          exerciseSet: 1,
          reps: 5,
          weight: 85,
          time_in_seconds: 0,
        });

        const response = await request.delete(
          BASE_ENDPOINT + `/${workout.id}/exercises/${exerciseToDelete.id}`
        );

        await actions.logoutUser(request);

        expect(response.statusCode).toStrictEqual(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        assertExerciseInWorkoutSwaggerSpec(response.body[0]);
        expect(response.body[0].exerciseId).toStrictEqual(exerciseToDelete.id);
        expect(response.body[0].exerciseSet).toStrictEqual(1);
        expect(response.body[0].reps).toStrictEqual(5);
        expect(response.body[0].weight).toStrictEqual(85);
        expect(response.body[0].time_in_seconds).toStrictEqual(0);
      });
    });
  });
});
