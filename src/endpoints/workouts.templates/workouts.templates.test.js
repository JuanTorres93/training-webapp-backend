const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  expectedTemplateProperties,
  mandatoryTemplatePropertiesInRequest,
  createNewTemplateRequest,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize, WorkoutTemplate } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(BASE_ENDPOINT, () => {
  describe("post requests", () => {
    let user;

    beforeAll(async () => {
      const setUpInfo = await setUp();

      user = setUpInfo.user;
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

      it("returns 201 status code", async () => {
        const req = createNewTemplateRequest(
          user.id,
          "template test",
          "template description"
        );
        const response = await request.post(BASE_ENDPOINT).send(req);

        expect(response.statusCode).toStrictEqual(201);
      });

      it("returns template object as specified in Swagger documentation", async () => {
        const req = createNewTemplateRequest(
          user.id,
          "template test",
          "template description"
        );
        const response = await request.post(BASE_ENDPOINT).send(req);
        const workoutTemplate = response.body;
        for (const property of expectedTemplateProperties) {
          expect(workoutTemplate).toHaveProperty(property);
        }
      });

      it("template is created in DB", async () => {
        const template = await WorkoutTemplate.findOne({
          where: {
            user_id: user.id,
            name: "template test",
            description: "template description",
          },
        });
        expect(template).toBeDefined();
        expect(template.user_id).toBe(user.id);
        expect(template.name).toBe("template test");
        expect(template.description).toBe("template description");
      });
    });

    describe("unhappy path", () => {
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("400 response when", () => {
        it("mandatory parameter is missing", async () => {
          for (const property of mandatoryTemplatePropertiesInRequest) {
            // Create a request object with the mandatory property missing
            const req = createNewTemplateRequest(
              user.id,
              "template test",
              "template description"
            );
            delete req[property];

            const response = await request.post(BASE_ENDPOINT).send(req);

            expect(response.statusCode).toStrictEqual(400);
          }
        });
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const req = createNewTemplateRequest(
            user.id,
            "template test",
            "template description"
          );
          const response = await request.post(BASE_ENDPOINT).send(req);

          expect(response.statusCode).toStrictEqual(401);
        });
      });
    });
  });
});
