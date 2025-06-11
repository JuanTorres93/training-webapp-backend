const {
  BASE_ENDPOINT,
  request,
  newUserReq,
  setUp,
} = require("./testsSetup.js");
const actions = require("../../utils/test_utils/actions.js");
const { UUIDRegex } = require("../testCommon.js");

const { sequelize } = require("../../models/index.js");

afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}/common`, () => {
  describe("get requests", () => {
    beforeAll(async () => {
      await setUp();
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
        const response = await request.get(BASE_ENDPOINT + `/common`);
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns list", async () => {
        const response = await request.get(BASE_ENDPOINT + `/common`);
        const templatesList = response.body;

        expect(templatesList).toBeInstanceOf(Array);
      });

      it("list contains templates as specified in Swagger documentation", async () => {
        const response = await request.get(BASE_ENDPOINT + `/common`);
        expect(response.body.length).toBeGreaterThan(0);
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

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(BASE_ENDPOINT + `/common`);
          expect(response.statusCode).toStrictEqual(401);
        });
      });
    });
  });
});
