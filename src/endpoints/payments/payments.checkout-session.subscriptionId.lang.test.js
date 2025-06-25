const factory = require("../../utils/test_utils/factory.js");
const actions = require("../../utils/test_utils/actions.js");

const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  setUp,
} = require("./testsSetup.js");

const { sequelize, Subscription } = require("../../models/index.js");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}/checkout-session/{subscriptionId}/{lang}`, () => {
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
        const response = await request.get(
          `${BASE_ENDPOINT}/checkout-session/${user.subscription_id}/en`
        );
        expect(response.statusCode).toBe(200);
      });

      it("returns spec", async () => {
        const response = await request.get(
          `${BASE_ENDPOINT}/checkout-session/${user.subscription_id}/en`
        );
        expect(response.body).toHaveProperty("status");
        expect(response.body.status).toBe("success");
        expect(response.body).toHaveProperty("session");
      });

      it("checkout session has correct info", async () => {
        // NOTE: It is done all in one test to avoid multiple calls to Stripe API

        // ============= IT HAS CORRECT PRICE =============
        // Default subscription price is 0 for free trial
        const responseFree = await request.get(
          `${BASE_ENDPOINT}/checkout-session/${user.subscription_id}/en`
        );
        expect(responseFree.body.session).toHaveProperty("amount_total");
        expect(responseFree.body.session.amount_total).toBe(0);

        // Update to a paid subscription
        const paidSubscription = await Subscription.findOne({
          where: { type: "PAID" },
        });

        const responsePaid = await request.get(
          `${BASE_ENDPOINT}/checkout-session/${paidSubscription.id}/en`
        );
        expect(responsePaid.body.session).toHaveProperty("amount_total");
        expect(responsePaid.body.session.amount_total).toBeGreaterThan(0);
        expect(responsePaid.body.session.amount_total).toStrictEqual(
          paidSubscription.base_price_in_eur_cents
        );

        // ============= IT HAS CORRECT CURRENCY =============
        expect(responseFree.body.session).toHaveProperty("currency");
        expect(responseFree.body.session.currency).toBe("eur");

        // ============= IT INCLUDES USER EMAIL =============
        expect(responseFree.body.session).toHaveProperty("customer_email");
        expect(responseFree.body.session.customer_email).toBe(user.email);
        expect(responseFree.body.session).toHaveProperty("customer_details");
        expect(responseFree.body.session.customer_details).toHaveProperty(
          "email"
        );
        expect(responseFree.body.session.customer_details.email).toBe(
          user.email
        );

        // ============= IT IS A SESSION FOR CREATING A SUBSCRIPTION =============
        expect(responseFree.body.session).toHaveProperty("mode");
        expect(responseFree.body.session.mode).toBe("subscription");

        // ============= PROVIDES URL FOR CHECKOUT PAGE =============
        expect(responseFree.body.session).toHaveProperty("url");
        expect(responseFree.body.session.url).toMatch(
          /https:\/\/checkout\.stripe\.com\/.+/
        );
      });
    });

    describe("unhappy paths", () => {
      describe("400 response when", () => {
        it(
          "subscriptionId is not UUID",
          factory.checkURLParamIsNotUUID(
            request,
            `${BASE_ENDPOINT}/checkout-session/TEST_PARAM/en`,
            "get"
          )
        );
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            `${BASE_ENDPOINT}/checkout-session/${user.subscription_id}/en`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("404 response when", () => {
        it("subscription does not exist", async () => {
          const wrongSubscriptionId = "12345678-1234-1234-1234-123456789012";
          const response = await request.get(
            `${BASE_ENDPOINT}/checkout-session/${wrongSubscriptionId}/en`
          );
          expect(response.statusCode).toBe(404);
        });
      });
    });
  });
});
