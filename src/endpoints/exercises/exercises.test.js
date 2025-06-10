const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  successfulPostRequest,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");
const { UUIDRegex } = require("../testCommon.js");

const expectedExerciseProperties = ["id", "name", "description"];

const { sequelize, Exercise } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}`, () => {
  describe("post requests", () => {
    describe("happy path", () => {
      let response;
      let newUser;

      beforeAll(async () => {
        const setUpInfo = await setUp();
        newUser = setUpInfo.newUser;

        // login user
        await actions.loginUser(request, newUserReq);

        response = await request
          .post(BASE_ENDPOINT)
          .send(successfulPostRequest);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
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

      it(
        "returns 201 status code",
        factory.checkStatusCode(() => response, 201)
      );

      it("also updates users_exercises table", async () => {
        const info2 = await sequelize.query(
          "SELECT user_id, exercise_id FROM users_exercises WHERE exercise_id = :exerciseId",
          {
            replacements: { exerciseId: response.body.id },
          }
        );

        expect(info2[0][0]).not.toBeUndefined();
        expect(info2[0][0].user_id).toStrictEqual(newUser.id);
        expect(info2[0][0].exercise_id).toStrictEqual(response.body.id);

        expect(info2[0][0].user_id).toMatch(UUIDRegex);
        expect(info2[0][0].exercise_id).toMatch(UUIDRegex);
      });
    });

    describe("unhappy paths", () => {
      let newUser;

      beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newUser = setUpInfo.newUser;

        // Ensure user is logged out
        await actions.logoutUser(request);
      });

      describe("400 error code when", () => {
        it(
          "mandatory parameter is missing",
          factory.checkUnhappyRequest(
            request,
            BASE_ENDPOINT,
            {
              // name is missing
              description: "Smith",
            },
            400
          )
        );
      });

      describe("401 error code when", () => {
        it(
          "user is not logged in",
          factory.checkUnhappyRequest(
            request,
            BASE_ENDPOINT,
            successfulPostRequest,
            401
          )
        );
      });
    });
  });
});
