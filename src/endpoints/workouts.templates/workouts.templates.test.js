const { request, BASE_ENDPOINT, newUserReq,
        createNewTemplateRequest } = require('./testsSetup');


const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');

    // Add user to db
    const userResponse = await request.post('/users').send(newUserReq);
    const user = userResponse.body;

    // login user
    await request.post('/login').send({
        username: newUserReq.alias,
        password: newUserReq.password,
    });

    // Add template to db
    const reqNewTemplate = createNewTemplateRequest(user.id, 'setup template', 'set up template description')
    const responseNewTemplate = await request.post(BASE_ENDPOINT).send(reqNewTemplate);
    const newTemplate = responseNewTemplate.body;

    // Add exercise to db
    const exerciseResponse = await request.post('/exercises').send({
        alias: "Pull up",
        description: "Fucks your shoulder",
    });
    const newExercise = exerciseResponse.body;

    // Add exercise to template
    const reqAddExerciseToTemplate = {
        exerciseId: newExercise.id,
        exerciseOrder: 1,
        exerciseSets: 3,
    };
    const responseAddExerciseToTemplate = await request.post(
        BASE_ENDPOINT + `/${newTemplate.id}`
    ).send(reqAddExerciseToTemplate);
    const newExerciseInTemplate = responseAddExerciseToTemplate.body;


    // logout user
    await request.get('/logout');

    return {
        user,
        newTemplate,
        newExercise,
        newExerciseInTemplate,
    };
};

describe(BASE_ENDPOINT, () => {
    describe('get requests', () => {
        beforeAll(async () => {
            const setUpInfo = await setUp();
        });

        describe('happy path', () => {
            it('returns 200 status code', async () => {
                const response = await request.get(BASE_ENDPOINT);

                expect(response.statusCode).toStrictEqual(200);
            });

            it("returns list", async () => {
                const response = await request.get(BASE_ENDPOINT);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('workout template object has correct properties', async () => {
                const response = await request.get(BASE_ENDPOINT);
                const workoutTemplate = response.body[0];

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('exercises');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
            });
        });

        // describe('unhappy path', () => {
        //     // TODO implement 401 and 403 cases
        // });
    });

    describe('post requests', () => {
        let user;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
        });

        describe('happy path', () => {
            it('returns 201 status code', async () => {
                const req = createNewTemplateRequest(user.id, 'template test', 'template description')
                const response = await request.post(BASE_ENDPOINT).send(req);

                expect(response.statusCode).toStrictEqual(201);
            });

            it('returns workout template object', async () => {
                const req = createNewTemplateRequest(user.id, 'template test', 'template description')
                const response = await request.post(BASE_ENDPOINT).send(req);
                const workoutTemplate = response.body;

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('userId');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
            });
        });

        describe('unhappy path', () => {
            describe('400 response when', () => {
                it('mandatory parameter is missing', async () => {
                    // Missing userId
                    const reqMissingUserId = {
                        alias: 'test',
                    }

                    let response = await request.post(BASE_ENDPOINT).send(reqMissingUserId);

                    expect(response.statusCode).toStrictEqual(400);

                    // Missing alias
                    const reqMissingAlias = {
                        userId: 1,
                    }

                    response = await request.post(BASE_ENDPOINT).send(reqMissingAlias);

                    expect(response.statusCode).toStrictEqual(400);
                });
            });
        });
    });
});
