const factory = require("../../utils/test_utils/factory.js");
const actions = require("../../utils/test_utils/actions.js");

const {
  request,
  BASE_ENDPOINT,
  newUserReq,
  privateFields,
  assertSubscriptionSpec,
  setUp,
} = require("./testsSetup.js");

const { sequelize, Subscription, User } = require("../../models/index.js");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}/user/{userId}`, () => {
  let user;
  let otherUser;

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
        const response = await request.get(`${BASE_ENDPOINT}/user/${user.id}`);
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns a subscription", async () => {
        const response = await request.get(`${BASE_ENDPOINT}/user/${user.id}`);
        assertSubscriptionSpec(response.body);
      });

      it("does not return private fields", async () => {
        const response = await request.get(`${BASE_ENDPOINT}/user/${user.id}`);

        privateFields.forEach((field) => {
          expect(response.body).not.toHaveProperty(field);
        });
      });

      it("FREE_TRIAL as default subscription", async () => {
        const response = await request.get(`${BASE_ENDPOINT}/user/${user.id}`);
        expect(response.body.type).toStrictEqual("FREE_TRIAL");
      });

      it("it does return private subscriptions", async () => {
        // Create a private subscription
        const [privateSubscription, created] = await Subscription.findOrCreate({
          where: { type: "PRIVATE_TEST" },
          defaults: {
            description: "Private subscription for testing",
            base_price_in_eur_cents: 1000,
            name: "Private Test Subscription",
            description_internal: "This is an internal description",
            is_public: false,
          },
        });

        // Associate the private subscription with the user
        const userInDb = await User.findByPk(user.id);
        await userInDb.update({
          subscription_id: privateSubscription.id,
        });

        // Fetch the subscription for the user
        const response = await request.get(`${BASE_ENDPOINT}/user/${user.id}`);
        const subscription = response.body;

        // Return user subscription to FREE_TRIAL
        const freeTrial = await Subscription.findOne({
          where: { type: "FREE_TRIAL" },
        });
        await userInDb.update({
          subscription_id: freeTrial.id,
        });

        // Assertions
        expect(subscription.type).toStrictEqual(privateSubscription.type);

        assertSubscriptionSpec(subscription);
      });
    });

    describe("unhappy paths", () => {
      describe("400 response when", () => {
        it(
          "userId is not UUID",
          factory.checkURLParamIsNotUUID(
            request,
            BASE_ENDPOINT + "/user/TEST_PARAM",
            "get"
          )
        );
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            `${BASE_ENDPOINT}/user/${user.id}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to access other user's subscription", async () => {
          await actions.loginUser(request, newUserReq);
          const response = await request.get(
            `${BASE_ENDPOINT}/user/${otherUser.id}`
          );
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });
    });
  });
});
