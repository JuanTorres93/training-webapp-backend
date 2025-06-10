const validator = require("validator");
const {
  request,
  BASE_ENDPOINT,
  USER_ALIAS,
  USER_PASSWORD,
  setUp,
} = require("./testsSetup.js");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models/index.js");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(BASE_ENDPOINT, () => {
  let user, otherUser;

  describe("get requests", () => {
    beforeAll(async () => {
      const setUpInfo = await setUp();
      user = setUpInfo.newUser;
      otherUser = setUpInfo.otherUser;
    });

    describe("happy path", () => {
      beforeEach(async () => {
        await actions.loginUser(request, {
          username: USER_ALIAS,
          password: USER_PASSWORD,
        });
      });

      afterEach(async () => {
        await actions.logoutUser(request);
      });

      it("returns id and expiration date", async () => {
        const response = await request.get(BASE_ENDPOINT + "/auth/me");

        expect(response).toHaveProperty("body.id");
        expect(response).toHaveProperty("body.expirationDate");

        expect(validator.isUUID(response.body.id)).toBe(true);
        expect(validator.isISO8601(response.body.expirationDate)).toBe(true);

        // Check that the expiration date is in the future
        const expiration = new Date(response.body.expirationDate);
        expect(expiration.getTime()).toBeGreaterThan(Date.now());
      });

      it("returns 200 status code", async () => {
        const response = await request.get(BASE_ENDPOINT + "/auth/me");
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns logged in user id", async () => {
        const response = await request.get(BASE_ENDPOINT + "/auth/me");

        expect(response.body.id).toStrictEqual(user.id);
        expect(response.body.id).not.toBe(otherUser.id);
      });
    });

    describe("unhappy path", () => {
      beforeAll(async () => {
        await actions.logoutUser(request);
      });

      it("returns 401 error when no user is logged in", async () => {
        const response = await request.get(BASE_ENDPOINT + "/auth/me");

        expect(response.statusCode).toStrictEqual(401);
      });
    });
  });
});
