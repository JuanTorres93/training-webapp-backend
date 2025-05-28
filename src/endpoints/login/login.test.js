const factory = require("../../utils/test_utils/factory.js");
const {
  request,
  BASE_ENDPOINT,
  USER_ALIAS,
  USER_PASSWORD,
  setUp,
} = require("./testsSetup");

const { expectedUserProperties } = require("../testCommon.js");

describe(BASE_ENDPOINT, () => {
  describe("post requests", () => {
    beforeAll(async () => {
      const setUpInfo = await setUp();
    });

    describe("happy path", () => {
      let response;
      let req;

      beforeAll(async () => {
        req = {
          username: USER_ALIAS,
          password: USER_PASSWORD,
        };

        response = await request.post(BASE_ENDPOINT).send(req);
      });

      it(
        "returns 200 status code",
        factory.checkStatusCode(() => response, 200)
      );

      it(
        "user info is appended to request",
        factory.checkCorrectResource(
          () => response.body.user,
          expectedUserProperties,
          ["password"]
        )
      );
    });

    describe("unhappy path", () => {
      describe("400 error when", () => {
        it(
          "username parameter is missing",
          factory.checkUnhappyRequest(
            request,
            BASE_ENDPOINT,
            {
              password: USER_PASSWORD,
            },
            400
          )
        );

        it(
          "password parameter is missing",
          factory.checkUnhappyRequest(
            request,
            BASE_ENDPOINT,
            {
              username: USER_ALIAS,
            },
            400
          )
        );

        describe("password is not strong", () => {
          it(
            "returns 400 when password is all lowercase",
            factory.checkUnhappyRequest(
              request,
              BASE_ENDPOINT,
              {
                username: USER_ALIAS,
                password: "password",
              },
              400
            )
          );

          it(
            "returns 400 when password is just lower and uppercase",
            factory.checkUnhappyRequest(
              request,
              BASE_ENDPOINT,
              {
                username: USER_ALIAS,
                password: "Password",
              },
              400
            )
          );

          it(
            "returns 400 when password is just lowercase and special characters",
            factory.checkUnhappyRequest(
              request,
              BASE_ENDPOINT,
              {
                username: USER_ALIAS,
                password: "p@ssword",
              },
              400
            )
          );

          it(
            "returns 400 when password is just lowercase and numbers",
            factory.checkUnhappyRequest(
              request,
              BASE_ENDPOINT,
              {
                username: USER_ALIAS,
                password: "p4ssword",
              },
              400
            )
          );
        });
      });
    });
  });
});
