const {
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  request,
  newUserReq,
  setUp,
} = require("./testsSetup");
const actions = require("../../utils/test_utils/actions.js");

const { sequelize } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(BASE_ENDPOINT + "/last/user/{userId}/{numberOfWorkouts}", () => {
  describe("get requests", () => {
    let user;
    let newTemplate;
    let newExercise;

    beforeAll(async () => {
      const setUpInfo = await setUp();

      user = setUpInfo.user;
      newTemplate = setUpInfo.newTemplate;
      newExercise = setUpInfo.newExercise;
    });

    describe("happy path", () => {
      beforeAll(async () => {
        // login user
        await actions.loginUser(request, newUserReq);

        // Add workout
        const newWorkoutReq = {
          template_id: newTemplate.id,
          description: "test workout",
        };
        await request.post("/workouts").send(newWorkoutReq);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("status code of 200", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        expect(response.statusCode).toStrictEqual(200);
      });

      it("returns array", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        expect(response.body).toBeInstanceOf(Array);
      });

      it("Objects of array have correct keys", async () => {
        const response = await request.get(
          BASE_ENDPOINT + `/last/user/${user.id}/${1}`
        );
        const template = response.body[0];
        expect(template).toHaveProperty("template_id");
        expect(template).toHaveProperty("workout_date");
        expect(template).toHaveProperty("workout_name");
      });
    });

    describe("unhappy path", () => {
      beforeAll(async () => {
        // Ensure user is logged out
        await actions.loginUser(request, newUserReq);
        await actions.logoutUser(request);
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${1}`
          );
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("trying to read another user's workout template", async () => {
          // login other user
          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.get(
            BASE_ENDPOINT + `/last/user/${user.id}/${1}`
          );

          // logout user
          await actions.logoutUser(request);
          expect(response.statusCode).toStrictEqual(403);
        });
      });
    });
  });
});
