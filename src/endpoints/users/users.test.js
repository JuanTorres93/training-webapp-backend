const factory = require("../../utils/test_utils/factory.js");

const {
  request,
  BASE_ENDPOINT,
  successfulPostRequest,
  setUp,
} = require("./testsSetup");
const {
  expectedUserProperties,
  newUserMandatoryParams,
} = require("../testCommon.js");
const hash = require("../../hashing.js");

const selectEverythingFromUserId = async (id) => {
  const response = await request.get(BASE_ENDPOINT + `/${id}/allTest`);
  return response.body;
};

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}`, () => {
  describe("post requests", () => {
    let response;

    beforeAll(async () => {
      await setUp();
      response = await request.post(BASE_ENDPOINT).send({
        ...successfulPostRequest,
        username: "second test user",
        email: "second_user@domain.com",
      });
    });

    describe("happy path", () => {
      it(
        "returns user object as specified in swagger documentation",
        factory.checkCorrectResource(
          () => response.body,
          expectedUserProperties,
          ["password"]
        )
      );

      it(
        "status code of 201",
        factory.checkStatusCode(() => response, 201)
      );

      it("does not store password as is submitted (plain text)", async () => {
        const userInDb = await selectEverythingFromUserId(response.body.id);

        expect(userInDb.password.trim()).not.toEqual(
          successfulPostRequest.password.trim()
        );
      });

      it("hashes password", async () => {
        const userInDb = await selectEverythingFromUserId(response.body.id);

        const passwordsMatch = await hash.comparePlainTextToHash(
          successfulPostRequest.password,
          userInDb.password
        );
        expect(passwordsMatch).toBe(true);
      });
    });

    describe("unhappy paths", () => {
      it("400 response when mandatory parameter is missing", async () => {
        for (const param of newUserMandatoryParams) {
          const body = { ...successfulPostRequest };

          // remove the mandatory parameter
          delete body[param];

          // username is missing
          let response = await request.post(BASE_ENDPOINT).send(body);

          expect(response.statusCode).toStrictEqual(400);
        }
      });

      it("409 response when email already exists in db", async () => {
        const req = {
          ...successfulPostRequest,
          // email same as successfulRequest
          username: "another_alias",
          last_name: "another_last_name",
          password: "@n0th3r_Pa$swOrd",
          second_last_name: "another second last name",
        };

        let response = await request.post(BASE_ENDPOINT).send(req);
        response = await request.post(BASE_ENDPOINT).send(req);
        expect(response.statusCode).toStrictEqual(409);
      });

      it("409 response when username already exists in db", async () => {
        let req = {
          ...successfulPostRequest,
          // username same as successfulRequest
          email: "another_mail@domain.com",
          last_name: "another_last_name",
          password: "@n0th3r_PasswOrd",
          second_last_name: "another second last name",
        };
        let response = await request.post(BASE_ENDPOINT).send(req);
        response = await request.post(BASE_ENDPOINT).send(req);
        expect(response.statusCode).toStrictEqual(409);
      });

      it("409 response when username already exists in db but with different capitalization", async () => {
        let req = {
          ...successfulPostRequest,
          username: successfulPostRequest.username.toUpperCase(),
          email: "notExistingEmail@domain.com",
          password: "@n0th3r_PasswOrd",
        };
        const response = await request.post(BASE_ENDPOINT).send(req);
        expect(response.statusCode).toStrictEqual(409);
      });
    });
  });
});
