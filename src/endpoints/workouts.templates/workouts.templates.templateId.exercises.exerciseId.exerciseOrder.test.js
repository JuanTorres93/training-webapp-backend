const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  newUserReq,
  createNewTemplateRequest,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");
const {
  User,
  WorkoutTemplate,
  WorkoutTemplateExercises,
  Exercise,
} = require("../../models");
const createCommonUser = require("../../createCommonUser.js").createCommonUser;

const setUp = async () => {
  await request.get(BASE_ENDPOINT + "/truncate");
  await request.get("/users/truncate");
  await request.get("/exercises/truncate");

  // Add user to db
  const userResponse = await request.post("/users").send(newUserReq);
  const user = userResponse.body;

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

  // Add template to db
  const reqNewTemplate = createNewTemplateRequest(
    user.id,
    "setup template",
    "set up template description"
  );
  const responseNewTemplate = await request
    .post(BASE_ENDPOINT)
    .send(reqNewTemplate);
  const newTemplate = responseNewTemplate.body;

  // Add exercise to db
  const { exercise: newExercise } = await actions.createNewExercise(request, {
    name: "Pull up",
    description: "Fucks your shoulder",
  });

  // Add exercise to template
  const addedExerciseResponse = await request
    .post(BASE_ENDPOINT + `/${newTemplate.id}`)
    .send({
      exerciseId: newExercise.id,
      exerciseOrder: 1,
      exerciseSets: 3,
    });
  const newExerciseInTemplate = addedExerciseResponse.body;

  // logout user
  await actions.logoutUser(request);

  return {
    user,
    newTemplate,
    newExercise,
    newExerciseInTemplate,
  };
};

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(
  BASE_ENDPOINT + "/{templateId}/exercises/{exerciseId}/{exerciseOrder}",
  () => {
    describe("put request", () => {
      describe("happy path", () => {
        let newTemplate;
        let newExercise;
        let newExerciseInTemplate;

        beforeEach(async () => {
          const setUpInfo = await setUp();

          newTemplate = setUpInfo.newTemplate;
          newExercise = setUpInfo.newExercise;
          newExerciseInTemplate = setUpInfo.newExerciseInTemplate;
        });

        it("returns 200 status code", async () => {
          const req = {
            exerciseOrder: 9,
            exerciseSets: 8,
          };

          // login user
          await actions.loginUser(request, newUserReq);

          const response = await request
            .put(
              BASE_ENDPOINT +
                `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`
            )
            .send(req);

          // logout user
          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(200);
        });

        it("updates only exercise order", async () => {
          const req = {
            newExerciseOrder: 9,
          };

          // login user
          await actions.loginUser(request, newUserReq);

          const response = await request
            .put(
              BASE_ENDPOINT +
                `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`
            )
            .send(req);

          // logout user
          await actions.logoutUser(request);

          const updatedWorkoutTemplateExercise = response.body;

          expect(updatedWorkoutTemplateExercise.exerciseOrder).not.toEqual(
            newExerciseInTemplate.exerciseOrder
          );
          expect(updatedWorkoutTemplateExercise.exerciseSets).toStrictEqual(
            newExerciseInTemplate.exerciseSets
          );
          expect(updatedWorkoutTemplateExercise.id).toStrictEqual(
            newExerciseInTemplate.id
          );
          expect(updatedWorkoutTemplateExercise.name).toStrictEqual(
            newExerciseInTemplate.name
          );
        });

        it("updates only exercise sets", async () => {
          const req = {
            exerciseSets: 9,
          };

          // login user
          await actions.loginUser(request, newUserReq);

          const response = await request
            .put(
              BASE_ENDPOINT +
                `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`
            )
            .send(req);

          // logout user
          await actions.logoutUser(request);

          const updatedWorkoutTemplateExercise = response.body;

          expect(updatedWorkoutTemplateExercise.exerciseOrder).toStrictEqual(
            newExerciseInTemplate.exerciseOrder
          );
          expect(updatedWorkoutTemplateExercise.exerciseSets).not.toEqual(
            newExerciseInTemplate.exerciseSets
          );
          expect(updatedWorkoutTemplateExercise.id).toStrictEqual(
            newExerciseInTemplate.id
          );
          expect(updatedWorkoutTemplateExercise.name).toStrictEqual(
            newExerciseInTemplate.name
          );
        });
      });

      describe("unhappy path", () => {
        let req;
        let newTemplate;
        let newExercise;
        let newExerciseInTemplate;

        beforeAll(async () => {
          req = {
            exerciseOrder: 8,
            exerciseSets: 8,
          };

          const setUpInfo = await setUp();

          newTemplate = setUpInfo.newTemplate;
          newExercise = setUpInfo.newExercise;
          newExerciseInTemplate = setUpInfo.newExerciseInTemplate;

          // Ensure user is logged out
          await actions.loginUser(request, newUserReq);
          await actions.logoutUser(request);
        });

        describe("returns 400 error code when", () => {
          it("templateId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT +
                "/TEST_PARAM" +
                `/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`,
              "put",
              req
            );
            await checkURLParamIsNotUUID();
          });

          it("exerciseId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT +
                `/${newTemplate.id}` +
                `/exercises/TEST_PARAM/${newExerciseInTemplate.exerciseOrder}`,
              "put",
              req
            );
            await checkURLParamIsNotUUID();
          });

          it("exerciseOrder is not positive integer", async () => {
            const checkURLParamIsNotInteger = factory.checkURLParamIsNotInteger(
              request,
              BASE_ENDPOINT +
                `/${newTemplate.id}` +
                `/exercises/${newExercise.id}/TEST_PARAM`,
              "put",
              req
            );
            await checkURLParamIsNotInteger();
          });
        });

        describe("401 response when", () => {
          it("user is not logged in", async () => {
            const req = {
              exerciseOrder: 9,
              exerciseSets: 8,
            };

            const response = await request
              .put(
                BASE_ENDPOINT +
                  `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`
              )
              .send(req);
            expect(response.statusCode).toStrictEqual(401);
          });
        });

        describe("403 response when", () => {
          it("trying to update exercise in another user's workout template", async () => {
            const req = {
              exerciseOrder: 9,
              exerciseSets: 8,
            };

            await actions.loginUser(request, {
              username: OTHER_USER_ALIAS,
              password: newUserReq.password,
            });

            const response = await request
              .put(
                BASE_ENDPOINT +
                  `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`
              )
              .send(req);

            // logout user
            await actions.logoutUser(request);
            expect(response.statusCode).toStrictEqual(403);
          });

          it("trying to update exercise in common user's template", async () => {
            const commonUser = await User.findOne({
              where: { email: process.env.DB_COMMON_USER_EMAIL },
            });

            const commonUserTemplate = await WorkoutTemplate.findOne({
              where: { user_id: commonUser.id },
            });
            const commonUserExercise = await WorkoutTemplateExercises.findOne({
              where: { workout_template_id: commonUserTemplate.id },
            });

            const req = {
              exerciseOrder: 9,
              exerciseSets: 8,
            };
            await actions.loginUser(request, {
              username: OTHER_USER_ALIAS,
              password: newUserReq.password,
            });
            const response = await request
              .put(
                BASE_ENDPOINT +
                  `/${commonUserTemplate.id}/exercises/${commonUserExercise.exercise_id}/${commonUserExercise.exercise_order}`
              )
              .send(req);

            await actions.logoutUser(request);
            expect(response.statusCode).toStrictEqual(403);
          });
        });

        describe("404 response when", () => {
          it("templateid is valid but template with that id does not exist", async () => {
            const response = await request
              .put(BASE_ENDPOINT + "/1" + `/exercises/${newExercise.id}`)
              .send(req);
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseId is valid but exercise with that id does not exist", async () => {
            const response = await request
              .put(BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/1`)
              .send(req);
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseOrder is valid but exercise with that order does not exist", async () => {
            const response = await request
              .put(
                BASE_ENDPOINT +
                  `/${newTemplate.id}/exercises/${newExercise.id}/999`
              )
              .send(req);
            expect(response.statusCode).toStrictEqual(404);
          });
        });
      });
    });

    describe("delete requests", () => {
      let newTemplate;
      let newExercise;
      let newExerciseInTemplate;

      beforeAll(async () => {
        const setUpInfo = await setUp();

        newTemplate = setUpInfo.newTemplate;
        newExercise = setUpInfo.newExercise;
        newExerciseInTemplate = setUpInfo.newExerciseInTemplate;
      });

      describe("unhappy path", () => {
        beforeAll(async () => {
          // Ensure user is logged out
          await actions.loginUser(request, newUserReq);
          await actions.logoutUser(request);
        });

        describe("returns 400 error code when", () => {
          it("templateId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT +
                "/TEST_PARAM" +
                `/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`,
              "delete"
            );
            await checkURLParamIsNotUUID();
          });

          it("exerciseId is not UUID", async () => {
            const checkURLParamIsNotUUID = factory.checkURLParamIsNotUUID(
              request,
              BASE_ENDPOINT +
                `/${newTemplate.id}` +
                `/exercises/TEST_PARAM/${newExerciseInTemplate.exerciseOrder}`,
              "delete"
            );
            await checkURLParamIsNotUUID();
          });

          it("exerciseOrder is not positive integer", async () => {
            const checkURLParamIsNotInteger = factory.checkURLParamIsNotInteger(
              request,
              BASE_ENDPOINT +
                `/${newTemplate.id}` +
                `/exercises/${newExercise.id}/TEST_PARAM`,
              "delete"
            );
            await checkURLParamIsNotInteger();
          });
        });

        describe("401 response when", () => {
          it("user is not logged in", async () => {
            const endpoint =
              BASE_ENDPOINT +
              `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`;
            const response = await request.delete(endpoint);
            expect(response.statusCode).toStrictEqual(401);
          });
        });

        describe("403 response when", () => {
          it("trying to delete exercise in another user's workout template", async () => {
            // login other user
            await actions.loginUser(request, {
              username: OTHER_USER_ALIAS,
              password: newUserReq.password,
            });

            const endpoint =
              BASE_ENDPOINT +
              `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`;
            const response = await request.delete(endpoint);

            // logout user
            await actions.logoutUser(request);
            expect(response.statusCode).toStrictEqual(403);
          });

          it("trying to delete exercise in common user's template", async () => {
            const commonUser = await User.findOne({
              where: { email: process.env.DB_COMMON_USER_EMAIL },
            });

            const commonUserTemplate = await WorkoutTemplate.findOne({
              where: { user_id: commonUser.id },
            });
            const commonUserExercise = await WorkoutTemplateExercises.findOne({
              where: { workout_template_id: commonUserTemplate.id },
            });

            // login other user
            await actions.loginUser(request, {
              username: OTHER_USER_ALIAS,
              password: newUserReq.password,
            });

            const endpoint =
              BASE_ENDPOINT +
              `/${commonUserTemplate.id}/exercises/${commonUserExercise.exercise_id}/${commonUserExercise.exercise_order}`;
            const response = await request.delete(endpoint);

            // logout user
            await actions.logoutUser(request);
            expect(response.statusCode).toStrictEqual(403);
          });
        });

        describe("404 response when", () => {
          it("templateId is valid but template with that id does not exist", async () => {
            // valid UUID that is unlikely to be in the db
            const uuid = "00000000-0000-0000-0000-000000000000";
            const endpoint =
              BASE_ENDPOINT +
              "/" +
              uuid +
              `/exercises/${newExerciseInTemplate.exerciseId}/${newExerciseInTemplate.exerciseOrder}`;
            const response = await request.delete(endpoint);
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseId is valid but exercise with that id does not exist", async () => {
            // Valid UUID but (probably) not existing in the database
            const uuid = "00000000-0000-0000-0000-000000000000";
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${newTemplate.id}` +
                `/exercises/${uuid}/${newExerciseInTemplate.exerciseOrder}`
            );
            expect(response.statusCode).toStrictEqual(404);
          });

          it("exerciseOrder is valid but exercise with that order does not exist", async () => {
            const response = await request.delete(
              BASE_ENDPOINT +
                `/${newTemplate.id}/exercises/${newExerciseInTemplate.exerciseId}/999`
            );
            expect(response.statusCode).toStrictEqual(404);
          });
        });
      });

      describe("happy path", () => {
        let newTemplate;
        let newExercise;
        let newExerciseInTemplate;

        beforeEach(async () => {
          const setUpInfo = await setUp();

          newTemplate = setUpInfo.newTemplate;
          newExercise = setUpInfo.newExercise;
          newExerciseInTemplate = setUpInfo.newExerciseInTemplate;
        });

        it("status code of 200", async () => {
          const endpoint =
            BASE_ENDPOINT +
            `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`;

          // login user. HERE CAUSE setUp ends loggin out
          await actions.loginUser(request, newUserReq);

          const response = await request.delete(endpoint);

          // logout user
          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(200);
        });

        it("returns deleted exercise", async () => {
          const endpoint =
            BASE_ENDPOINT +
            `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`;

          // login user. HERE CAUSE setUp ends loggin out
          await actions.loginUser(request, newUserReq);

          const response = await request.delete(endpoint);

          // logout user
          await actions.logoutUser(request);

          const deletedExercise = response.body;

          expect(deletedExercise.workoutTemplateId).toStrictEqual(
            newExerciseInTemplate.workoutTemplateId
          );
          expect(deletedExercise.exerciseId).toStrictEqual(
            newExerciseInTemplate.exerciseId
          );
          expect(deletedExercise.exerciseSets).toStrictEqual(
            newExerciseInTemplate.exerciseSets
          );
          expect(deletedExercise.exerciseOrder).toStrictEqual(
            newExerciseInTemplate.exerciseOrder
          );
        });

        it("deletes exercise from database", async () => {
          const endpoint =
            BASE_ENDPOINT +
            `/${newTemplate.id}/exercises/${newExercise.id}/${newExerciseInTemplate.exerciseOrder}`;

          // login user. HERE CAUSE setUp ends loggin out
          await actions.loginUser(request, newUserReq);

          const response = await request.delete(endpoint);

          // logout user
          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(200);

          const exerciseInDb = await WorkoutTemplateExercises.findOne({
            where: {
              workout_template_id: newTemplate.id,
              exercise_id: newExercise.id,
              exercise_order: newExerciseInTemplate.exerciseOrder,
            },
          });

          expect(exerciseInDb).toBeNull();
        });
      });
    });
  }
);
