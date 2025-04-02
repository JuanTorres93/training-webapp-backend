// NOTE: subscriptions is tested here because I dont' plan
// right now to make an endpoint for them

const db = require("./subscriptions");

const newSubscription = {
  type: "type1",
  description: "description1",
  basePriceInEurCents: 1000,
  name: "name1",
  description_internal: "description_internal1",
};

const newSubscription2 = {
  type: "type2",
  description: "description2",
  basePriceInEurCents: 2000,
  name: "name2",
  description_internal: "description_internal2",
};

describe("subscriptions db", () => {
  describe("default state", () => {
    it("selects FREE_TRIAL subscription", async () => {
      const freeTrialSubscription = await db.selectFreeTrialSubscription();
      expect(freeTrialSubscription).toMatchObject({
        type: "FREE_TRIAL",
      });
    });
  });

  describe("happy path", () => {
    describe("Subscription creation", () => {
      beforeAll(async () => {
        await db.truncateTableTest();
      });

      it("creates subscription", async () => {
        const expectedSubscription = {
          ...newSubscription,
          base_price_in_eur_cents: 1000,
        };
        delete expectedSubscription.basePriceInEurCents;
        delete expectedSubscription.description_internal;

        const createdSubscription = await db.addSubscription(newSubscription);

        expect(createdSubscription).toMatchObject(expectedSubscription);
        // createdSubscription.id is an UUID
        expect(createdSubscription.id).toBeDefined();
        const uuidRegex =
          /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
        expect(createdSubscription.id).toMatch(uuidRegex);
      });

      it("Does not create an already existing subscription type", () => {
        const createdSubscription = db.addSubscription(newSubscription);

        expect(createdSubscription).resolves.toMatchObject({
          subscription: null,
        });
        expect(createdSubscription).resolves.toHaveProperty("error");
      });
    });

    describe("Subscription selection", () => {
      beforeAll(async () => {
        await db.truncateTableTest();
        await db.addSubscription(newSubscription2);
      });

      it("selects all subscriptions", async () => {
        const currentSubscriptions = await db.selectAllSubscriptions();

        // Expect each subscription to have an id
        currentSubscriptions.forEach((subscription) => {
          expect(subscription.id).toBeDefined();
          const uuidRegex =
            /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
          expect(subscription.id).toMatch(uuidRegex);
        });

        const expectedSubscriptions = [
          {
            ...newSubscription2,
            base_price_in_eur_cents: 2000,
          },
        ];
        delete expectedSubscriptions[0].basePriceInEurCents;
        delete expectedSubscriptions[0].description_internal;

        // remove id from currentSubscriptions
        currentSubscriptions.forEach((subscription) => {
          delete subscription.id;
        });

        expect(currentSubscriptions).toEqual(
          expect.arrayContaining(expectedSubscriptions)
        );
      });

      it("selects subscription by id", async () => {
        const currentSubscriptions = await db.selectAllSubscriptions();
        const subscriptionId = currentSubscriptions[0].id;

        const selectedSubscription = await db.selectSuscriptionById(
          subscriptionId
        );
        expect(selectedSubscription).toEqual(currentSubscriptions[0]);
      });

      it("selects subscription by type", async () => {
        const subscriptionType = newSubscription2.type;
        const selectedSubscription = await db.selectSuscriptionByType(
          subscriptionType
        );

        // expect to have id as uuid type
        expect(selectedSubscription.id).toBeDefined();
        const uuidRegex =
          /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
        expect(selectedSubscription.id).toMatch(uuidRegex);

        // remove id
        delete selectedSubscription.id;

        const expectedSubscription = {
          ...newSubscription2,
          base_price_in_eur_cents: 2000,
        };

        delete expectedSubscription.basePriceInEurCents;
        delete expectedSubscription.description_internal;

        expect(selectedSubscription).toEqual(expectedSubscription);
      });
    });
  });
});
