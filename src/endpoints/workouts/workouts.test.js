const {
  request,
  BASE_ENDPOINT,
  OTHER_USER_ALIAS,
  newUserReq,
  mandatoryWorkoutFields,
  setUp,
  assertWorkoutSwaggerSpec,
} = require("./testsSetup");

const actions = require("../../utils/test_utils/actions.js");

const { sequelize, WorkoutTemplate, User } = require("../../models");
afterAll(async () => {
  // Close the database connection after all tests
  await sequelize.close();
});

describe(`${BASE_ENDPOINT}`, () => {
  let template;
  let newWorkoutReq;
  describe("post requests", () => {
    describe("happy path", () => {
      let response;

      beforeAll(async () => {
        const setupInfo = await setUp();
        const { user } = setupInfo;

        // login user
        await actions.loginUser(request, newUserReq);

        const newTemplateReq = {
          userId: user.id,
          name: "Template 1",
          description: "Template 1 description",
        };

        const templateResponse = await request
          .post("/workouts/templates")
          .send(newTemplateReq);
        template = templateResponse.body;

        newWorkoutReq = {
          template_id: template.id,
          description: "Workout 1 description",
        };

        response = await request.post(BASE_ENDPOINT).send(newWorkoutReq);
      });

      afterAll(async () => {
        // logout user
        await actions.logoutUser(request);
      });

      it("returns workout object as specified in Swagger docs", () => {
        assertWorkoutSwaggerSpec(response.body);

        // When first created, the workout should not have any exercises
        expect(response.body.exercises).toHaveLength(0);
      });

      it("returns 201 status code", () => {
        expect(response.statusCode).toStrictEqual(201);
      });

      it("returns workout when template is common", async () => {
        const commonUser = await User.findOne({
          where: { email: process.env.DB_COMMON_USER_EMAIL },
        });

        const commonTemplate = await WorkoutTemplate.findOne({
          where: { user_id: commonUser.id },
        });

        const commonResponse = await request.post(BASE_ENDPOINT).send({
          template_id: commonTemplate.id,
          description: "Common Workout description",
        });

        assertWorkoutSwaggerSpec(commonResponse.body);
        expect(commonResponse.statusCode).toStrictEqual(201);
        expect(commonResponse.body.exercises).toHaveLength(0);
      });
    });

    describe("unhappy paths", () => {
      let user, otherUser;
      let userTemplate;

      beforeAll(async () => {
        const setupInfo = await setUp();

        user = setupInfo.user;
        otherUser = setupInfo.otherUser;

        await actions.loginUser(request, newUserReq);

        const templateResponse = await actions.createNewEmptyTemplate(request, {
          userId: user.id,
          name: "User's Template",
          description: "User's Template description",
        });
        userTemplate = templateResponse.template;

        await actions.logoutUser(request);
      });

      it("400 response when mandatory parameter is missing", async () => {
        for (const field of mandatoryWorkoutFields) {
          // Create a request object with the mandatory field missing
          const requestBody = { ...newWorkoutReq };
          delete requestBody[field];

          const response = await request.post(BASE_ENDPOINT).send(requestBody);

          expect(response.statusCode).toStrictEqual(400);
        }
      });

      describe("401 response when", () => {
        it("user is not logged in", async () => {
          const response = await request
            .post(BASE_ENDPOINT)
            .send(newWorkoutReq);
          expect(response.statusCode).toStrictEqual(401);
        });
      });

      describe("403 response when", () => {
        it("template does not belong to user or common user", async () => {
          const userTemplate = await WorkoutTemplate.findOne({
            where: { user_id: user.id },
          });

          await actions.loginUser(request, {
            username: OTHER_USER_ALIAS,
            password: newUserReq.password,
          });

          const response = await request.post(BASE_ENDPOINT).send({
            template_id: userTemplate.id,
            description: "Workout marauder description",
          });

          await actions.logoutUser(request);

          expect(response.statusCode).toStrictEqual(403);
        });
      });

      describe("404 response when", () => {
        it("template does not exist", async () => {
          await actions.loginUser(request, newUserReq);
          const response = await request.post(BASE_ENDPOINT).send({
            template_id: "00000000-0000-0000-0000-000000000000",
            description: "Workout with non-existing template",
          });
          expect(response.statusCode).toStrictEqual(404);
          await actions.logoutUser(request);
        });
      });
    });
  });
});
