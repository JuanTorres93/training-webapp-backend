const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  newUserReq,
  successfulPostRequest,
  expectedExerciseProperties,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");
const { UUIDRegex } = require("../testCommon.js");

const { sequelize, User, Exercise } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/{exerciseId}", () => {
  let newExercise;

  describe("get requests", () => {
    describe("happy path", () => {
      let response;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // login user
        await actions.loginUser(request, newUserReq);
        // Test response
        response = await request.get(BASE_ENDPOINT + `/${newExercise.id}`);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it(
        "returns exercise object",
        factory.checkCorrectResource(
          () => response.body,
          expectedExerciseProperties
        )
      );

      it("id is UUID", () => {
        const id = response.body.id;
        expect(id).toMatch(UUIDRegex);
      });

      it("can read common user exercise", async () => {
        const commonUserExercise = await Exercise.findOne({
          include: [
            {
              model: User,
              as: "users",
              where: {
                email: process.env.DB_COMMON_USER_EMAIL,
              },
            },
          ],
        });

        const res = await request.get(
          BASE_ENDPOINT + `/${commonUserExercise.id}`
        );
        expect(res.statusCode).toStrictEqual(200);

        for (const property of expectedExerciseProperties) {
          expect(res.body).toHaveProperty(property);
        }
        expect(res.body.id).toStrictEqual(commonUserExercise.id);
        expect(res.body.name).toStrictEqual(commonUserExercise.name);
        expect(res.body.description).toStrictEqual(
          commonUserExercise.description
        );
      });
    });

    describe("uphappy paths", () => {
      let response;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // Login user
        await actions.loginUser(request, newUserReq);

        // Test response
        response = await request.get(BASE_ENDPOINT + `/${newExercise.id}`);

        await actions.logoutUser(request);
      });

      afterAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it(
          "exerciseId is not UUID",
          factory.checkURLParamIsNotUUID(request, BASE_ENDPOINT + "/TEST_PARAM")
        );
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          // Logout user
          await actions.logoutUser(request);
          const response = await request.get(
            BASE_ENDPOINT + `/${newExercise.id}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("exercise does not belong to logged in user", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/${newExercise.id}`
          );
          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("exerciseId is valid but exercise with that id does not exist", async () => {
          await actions.loginUser(request, newUserReq);
          // Valid UUID but (probably) not existing in the database
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(BASE_ENDPOINT + "/" + uuid);
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });

  describe("put request", () => {
    const putBodyRequest = {
      name: "updated name",
      description: "updated description",
    };

    describe("happy path", () => {
      let response;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // Login user
        await actions.loginUser(request, newUserReq);

        // Test response
        response = await request
          .put(BASE_ENDPOINT + `/${newExercise.id}`)
          .send(putBodyRequest);

        // Logout user
        await actions.logoutUser(request);
      });

      it("returns updated exercise", () => {
        const updatedExercise = response.body;

        expect(updatedExercise.id).toStrictEqual(newExercise.id);
        expect(updatedExercise.name).toStrictEqual(putBodyRequest.name);
        expect(updatedExercise.description).toStrictEqual(
          putBodyRequest.description
        );
      });

      it("returns 200 status code", () => {
        expect(response.statusCode).toStrictEqual(200);
      });
    });

    describe("unhappy path", () => {
      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("returns 400 error code when", () => {
        it("exerciseid is string", async () => {
          const response = await request
            .put(BASE_ENDPOINT + "/wrongId")
            .send(putBodyRequest);
          expect(response.statusCode).toStrictEqual(400);
        });

        it("exerciseid is boolean", async () => {
          const response = await request
            .put(BASE_ENDPOINT + "/true")
            .send(putBodyRequest);
          expect(response.statusCode).toStrictEqual(400);
        });

        it("exerciseid is not positive", async () => {
          const response = await request
            .put(BASE_ENDPOINT + "/-23")
            .send(putBodyRequest);
          expect(response.statusCode).toStrictEqual(400);
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request
            .put(BASE_ENDPOINT + `/${newExercise.id}`)
            .send(putBodyRequest);
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to update another user's exercise", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request
            .put(BASE_ENDPOINT + `/${newExercise.id}`)
            .send(putBodyRequest);

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("exerciseid is valid but exercise with that id does not exist", async () => {
          // Valid UUID but (probably) not existing in the database
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.put(BASE_ENDPOINT + "/" + uuid).send({
            ...putBodyRequest,
            name: "updated name with put modified",
            description: "updated_description_with_put_modified",
          });
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });

  describe("delete requests", () => {
    // In this suite unhappy path is tested first in order to preserve the
    // entry in the database
    describe("unhappy path", () => {
      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("returns 400 error code when", () => {
        it("exerciseid is string", async () => {
          const response = await request.delete(BASE_ENDPOINT + "/wrongId");
          expect(response.statusCode).toStrictEqual(400);
        });

        it("exerciseid is boolean", async () => {
          const response = await request.delete(BASE_ENDPOINT + "/true");
          expect(response.statusCode).toStrictEqual(400);
        });

        it("exerciseid is not positive", async () => {
          const response = await request.delete(BASE_ENDPOINT + "/-23");
          expect(response.statusCode).toStrictEqual(400);
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.delete(
            BASE_ENDPOINT + `/${newExercise.id}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to update another user's exercise", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.delete(
            BASE_ENDPOINT + `/${newExercise.id}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("exerciseid is valid but exercise with that id does not exist", async () => {
          // Valid UUID but (probably) not existing in the database
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.delete(BASE_ENDPOINT + "/" + uuid);
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });

    describe("happy path", () => {
      let response;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;

        // login user
        await actions.loginUser(request, newUserReq);

        // Test response
        response = await request.delete(BASE_ENDPOINT + `/${newExercise.id}`);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", async () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns deleted exercise", () => {
        const deletedexercise = response.body;

        expect(deletedexercise.id).toStrictEqual(newExercise.id);
        expect(deletedexercise.name).toStrictEqual(successfulPostRequest.name);
        expect(deletedexercise.description).toStrictEqual(
          successfulPostRequest.description
        );
      });
    });
  });
});
