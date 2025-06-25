const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  expectedExerciseProperties,
  setUp,
} = require("./testsSetup.js");
const actions = require("../../utils/test_utils/actions.js");
const { langSeparator } = require("../../config.js");

const { sequelize, Exercise } = require("../../models/index.js");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}` + "/common", () => {
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
        response = await request.get(BASE_ENDPOINT + `/common`);

        await actions.logoutUser(request);
      });

      it("status code of 200", () => {
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns a list", () => {
        expect(Array.isArray(response.body)).toStrictEqual(true);
      });

      it(
        "list contains exercise object",
        factory.checkCorrectResource(
          () => response.body[0],
          expectedExerciseProperties
        )
      );

      it("exercise is translated", async () => {
        const commonExercises = response.body;

        for (const exercise of commonExercises) {
          expect(exercise.name).toContain(langSeparator);
          expect(exercise.description).toContain(langSeparator);
        }
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
        response = await request.get(BASE_ENDPOINT + `/common`);
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(BASE_ENDPOINT + `/common`);
          expect(response.statusCode).toStrictEqual(401);
        });
      });
    });
  });
});
