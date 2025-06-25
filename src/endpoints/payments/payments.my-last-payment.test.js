const factory = require("../../utils/test_utils/factory.js");
const actions = require("../../utils/test_utils/actions.js");

const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  assertPaymentSpec,
  setUp,
} = require("./testsSetup.js");

const { sequelize, Payment } = require("../../models/index.js");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}/my-last-payment`, () => {
  let user, otherUser;
  describe("get requests", () => {
    beforeAll(async () => {
      const setupInfo = await setUp();
      user = setupInfo.newUser;
      otherUser = setupInfo.otherUser;
    });

    describe("happy path", () => {
      beforeAll(async () => {
        await actions.loginUser(request, newUserReq);
      });

      afterAll(async () => {
        await actions.logoutUser(request);
      });

      it("returns 200 status code", async () => {
        const response = await request.get(`${BASE_ENDPOINT}/my-last-payment`);
        expect(response.statusCode).toBe(200);
      });

      it("returns payment spect", async () => {
        const response = await request.get(`${BASE_ENDPOINT}/my-last-payment`);
        const payment = response.body;
        assertPaymentSpec(payment);
      });
    });

    describe("unhappy paths", () => {
      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            `${BASE_ENDPOINT}/my-last-payment`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });
    });
  });
});
