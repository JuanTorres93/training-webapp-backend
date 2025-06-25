const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  newUserReq,
  expectedExerciseProperties,
  successfulPostRequest,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize, Exercise, User } = require("../../models");
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

      it("returns all user exercises", async () => {
        const includeObject = {
          model: User,
          as: "users",
          where: { id: newUser.id },
        };

        const initialExercises = await Exercise.findAll({
          include: [includeObject],
        });

        const initialExercisesCount = initialExercises.length;

        await actions.loginUser(request, newUserReq);

        // add a new exercise
        await actions.createNewExercise(request, {
          ...successfulPostRequest,
        });

        await actions.logoutUser(request);

        const finalExercises = await Exercise.findAll({
          include: [includeObject],
        });

        expect(finalExercises.length).toStrictEqual(initialExercisesCount + 1);
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
        it(
          "exerciseId is not UUID",
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
            BASE_ENDPOINT + `/all/${newUser.id}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to read another user's exercises", async () => {
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

        it("trying to read common user's exercises", async () => {
          const commonUser = await User.findOne({
            where: {
              email: process.env.DB_COMMON_USER_EMAIL,
            },
          });

          await actions.loginUser(request, newUserReq);
          const response = await request.get(
            BASE_ENDPOINT + `/all/${commonUser.id}`
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
