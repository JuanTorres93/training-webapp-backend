const factory = require("../../utils/test_utils/factory.js");
const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");
const { UUIDRegex } = require("../testCommon.js");

const { sequelize, User } = require("../../models");

afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}/all/{userId}`, () => {
  describe("get requests", () => {
    let user;
    let newTemplate;
    let newExercise;
    let otherUser;

    beforeAll(async () => {
      const setUpInfo = await setUp();

      user = setUpInfo.user;
      newTemplate = setUpInfo.newTemplate;
      newExercise = setUpInfo.newExercise;
      otherUser = setUpInfo.otherUser;
    });

    describe("happy path", () => {
      beforeAll(async () => {
        // login user
        await actions.loginUser(request, newUserReq);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", async () => {
        const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns list", async () => {
        const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
        const templatesList = response.body;

        expect(templatesList).toBeInstanceOf(Array);
      });

      it("List contains templates", async () => {
        const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
        expect(response.body.length).toBeGreaterThan(0);
        const workoutTemplateObject = response.body[0];

        expect(workoutTemplateObject).toHaveProperty("id");
        expect(workoutTemplateObject).toHaveProperty("name");
        expect(workoutTemplateObject).toHaveProperty("description");
        expect(workoutTemplateObject).toHaveProperty("exercises");
      });

      it("list contains template object as specified in Swagger documentation", async () => {
        const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
        const workoutTemplates = response.body;

        for (const template of workoutTemplates) {
          expect(template).toHaveProperty("id");
          expect(template.id).toMatch(UUIDRegex);
          expect(template).toHaveProperty("name");
          expect(template).toHaveProperty("description");
          expect(template).toHaveProperty("exercises");
          expect(template.exercises).toBeInstanceOf(Array);

          for (const exercise of template.exercises) {
            expect(exercise).toHaveProperty("id");
            expect(exercise.id).toMatch(UUIDRegex);
            expect(exercise).toHaveProperty("name");
            expect(exercise).toHaveProperty("order");
            expect(exercise).toHaveProperty("sets");
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
          const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to read another user's workout template", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });

        it("trying to read common user's templates", async () => {
          const commonUser = await User.findOne({
            where: { email: process.env.DB_COMMON_USER_EMAIL },
          });

          await actions.loginUser(request, newUserReq);

          const response = await request.get(
            BASE_ENDPOINT + `/all/${commonUser.id}`
          );
          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("templateId is valid but template with that id does not exist", async () => {
          // generate a valid UUID that probably won't be in the db
          const uuid = "00000000-0000-0000-0000-000000000000";
          const response = await request.get(BASE_ENDPOINT + "/all/" + uuid);
          expect(response.statusCode).toStrictEqual(404);
        });
      });
    });
  });
});
