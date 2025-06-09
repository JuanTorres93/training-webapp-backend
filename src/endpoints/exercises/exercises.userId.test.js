const {
  request,
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  newUserReq,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/all/{userId}", () => {
  let newExercise;

  describe("get requests", () => {
    describe("happy path", () => {
      let response;
      let newUser;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;
        newUser = setUpInfo.newUser;

        // login user
        await actions.loginUser(request, newUserReq);

        // Test response
        response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns a list", () => {
        expect(Array.isArray(response.body)).toStrictEqual(true);
      });

      it("exercise object has id, name, and description properties", () => {
        const exerciseObject = response.body[0];

        expect(exerciseObject).toHaveProperty("id");
        expect(exerciseObject).toHaveProperty("name");
        expect(exerciseObject).toHaveProperty("description");
      });
    });

    describe("uphappy paths", () => {
      let response;
      let newUser;
      let newExercise;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newExercise = setUpInfo.newExercise;
        newUser = setUpInfo.newUser;

        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);

        // Test response
        response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);
      });

      describe("400 response when", () => {
        it("userId is string", async () => {
          const response = await request.get(BASE_ENDPOINT + "/all/wrongId");
          expect(response.statusCode).toStrictEqual(400);
        });

        it("userId is boolean", async () => {
          const response = await request.get(BASE_ENDPOINT + "/all/true");
          expect(response.statusCode).toStrictEqual(400);
        });

        it("userId is not positive", async () => {
          const response = await request.get(BASE_ENDPOINT + "/all/-34");
          expect(response.statusCode).toStrictEqual(400);
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/all/${newUser.id}`
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
            BASE_ENDPOINT + `/all/${newUser.id}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("userId is valid but user with that id does not exist", async () => {
          // generate a valid UUID that probably won't be in the db
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(BASE_ENDPOINT + "/all/" + uuid);
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
