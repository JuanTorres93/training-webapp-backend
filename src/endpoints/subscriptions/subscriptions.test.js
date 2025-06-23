const factory = require("../../utils/test_utils/factory.js");
const actions = require("../../utils/test_utils/actions.js");

const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  privateFields,
  assertSubscriptionSpec,
  setUp,
} = require("./testsSetup");

const { sequelize, Subscription } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}`, () => {
  describe("get requests", () => {
    beforeAll(async () => {
      await setUp();
    });

    describe("happy path", () => {
      beforeAll(async () => {
        await actions.loginUser(request, newUserReq);
      });

      afterAll(async () => {
        await actions.logoutUser(request);
      });

      it("returns 200 status code", async () => {
        const response = await request.get(BASE_ENDPOINT);
        expect(response.statusCode).toBe(200);
      });

      it("returns a list of subscriptions", async () => {
        const response = await request.get(BASE_ENDPOINT);
        const subscriptions = response.body;

        for (subscription of subscriptions) {
          assertSubscriptionSpec(subscription);
        }
      });

      it("does not return private fields", async () => {
        const response = await request.get(BASE_ENDPOINT);
        const subscriptions = response.body;

        for (subscription of subscriptions) {
          privateFields.forEach((field) => {
            expect(subscription).not.toHaveProperty(field);
          });
        }
      });

      it("it does not return private subscriptions", async () => {
        const [privateSubscription, created] = await Subscription.findOrCreate({
          where: { type: "PRIVATE_TEST" }, // criterio para buscar
          defaults: {
            description: "Private subscription for testing",
            base_price_in_eur_cents: 1000,
            name: "Private Test Subscription",
            description_internal: "This is an internal description",
            is_public: false,
          },
        });

        const response = await request.get(BASE_ENDPOINT);
        const subscriptions = response.body;

        const subscriptionTypes = subscriptions.map(
          (subscription) => subscription.type
        );
        expect(subscriptionTypes).not.toContain(privateSubscription.type);
      });
    });

    describe("unhappy paths", () => {
      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(BASE_ENDPOINT);
          expect(response.statusCode).toStrictEqual(401);
        });
      });
    });
  });
});
