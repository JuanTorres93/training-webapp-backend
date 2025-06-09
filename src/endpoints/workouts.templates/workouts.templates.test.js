const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  createNewTemplateRequest,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models");
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

      it("returns workout template object", async () => {
        const req = createNewTemplateRequest(
          user.id,
          "template test",
          "template description"
        );
        const response = await request.post(BASE_ENDPOINT).send(req);
        const workoutTemplate = response.body;

        expect(workoutTemplate).toHaveProperty("id");
        expect(workoutTemplate).toHaveProperty("userId");
        expect(workoutTemplate).toHaveProperty("name");
        expect(workoutTemplate).toHaveProperty("description");
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
          // Missing userId
          const reqMissingUserId = {
            name: "test",
          };

          let response = await request
            .post(BASE_ENDPOINT)
            .send(reqMissingUserId);

          expect(response.statusCode).toStrictEqual(400);

          // Missing name
          const reqMissingAlias = {
            userId: 1,
          };

          response = await request.post(BASE_ENDPOINT).send(reqMissingAlias);

          expect(response.statusCode).toStrictEqual(400);
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
