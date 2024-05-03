const { request, BASE_ENDPOINT, createNewTemplateRequest, newUserReq } = require('./testsSetup');

OTHER_USER_ALIAS = 'other user';

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');
    await request.get('/exercises/truncate');

    // Add user to db
    const userResponse = await request.post('/users').send(newUserReq);
    const user = userResponse.body;

    // Add other user to db
    const otherUserResponse = await request.post('/users').send({
        ...newUserReq,
        alias: OTHER_USER_ALIAS,
        email: 'other@user.com',
    });
    const otherUser = otherUserResponse.body;

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

    // logout user
    await request.get('/logout');

    return {
        user,
        newTemplate,
        newExercise,
    };
};

describe(BASE_ENDPOINT + '/{templateId}', () => {
    describe('get requests', () => {
        let user;
        let newTemplate;
        let newExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
        });

        describe('happy path', () => {
            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns template object when it has no exercises', async () => {
                const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
                const workoutTemplateObject = response.body;

                expect(workoutTemplateObject).toHaveProperty('id');
                expect(workoutTemplateObject).toHaveProperty('alias');
                expect(workoutTemplateObject).toHaveProperty('description');
                expect(workoutTemplateObject).toHaveProperty('exercises');

                expect(workoutTemplateObject.exercises.length).toStrictEqual(0);
            });

            it('returns template object when it do have exercises', async () => {
                await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                    exerciseSets: 3,
                });

                const getResponse = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
                const workoutTemplateObject = getResponse.body;

                expect(workoutTemplateObject).toHaveProperty('id');
                expect(workoutTemplateObject).toHaveProperty('alias');
                expect(workoutTemplateObject).toHaveProperty('description');
                expect(workoutTemplateObject).toHaveProperty('exercises');
                expect(workoutTemplateObject.exercises.length).toBeGreaterThan(0);

                const exercise = workoutTemplateObject.exercises[0];
                expect(exercise).toHaveProperty('id');
                expect(exercise).toHaveProperty('alias');
                expect(exercise).toHaveProperty('order');
                expect(exercise).toHaveProperty('sets');
            });
        });

        describe('unhappy path', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to read another user\'s workout template', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('post requests', () => {
        let user;
        let newTemplate;
        let newExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                const req = {
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                    exerciseSets: 3,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it('returns 201 status code', async () => {
                expect(response.statusCode).toStrictEqual(201);
            });

            it('returns workout template object', async () => {
                const workoutTemplateExercise = response.body;

                expect(workoutTemplateExercise).toHaveProperty('workoutTemplateId');
                expect(workoutTemplateExercise).toHaveProperty('exerciseId');
                expect(workoutTemplateExercise).toHaveProperty('exerciseOrder');
                expect(workoutTemplateExercise).toHaveProperty('exerciseSets');
            });
        });

        describe('unhappy path', () => {
            let req;

            beforeAll(async () => {
                req = {
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                    exerciseSets: 3,
                };

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('400 response when', () => {
                it('templateId is string', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/wrongId').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is boolean', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/true').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is not positive', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/-34').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('mandatory body parameter is missing', async () => {
                    // exerciseId is missing
                    let res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                        exerciseOrder: 1,
                        exerciseSets: 3,
                    })

                    expect(res.statusCode).toStrictEqual(400);

                    // exerciseSets is missing
                    res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                        exerciseId: newExercise.id,
                        exerciseOrder: 1,
                    })

                    expect(res.statusCode).toStrictEqual(400);

                    // exerciseOrder is missing
                    res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                        exerciseId: newExercise.id,
                        exerciseSets: 3,
                    })

                    expect(res.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but it does not exist', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/1`).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('templateId is valid and exists, but exercise with that id does not exist', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                        ...req,
                        exerciseId: 1,
                    });
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put requests', () => {
        let newTemplate;
        let newExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
        });

        describe('happy path', () => {
            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it('returns 200 status code', async () => {
                const req = {
                    alias: 'test 200 code',
                    description: 'new description for 200 code',
                };
                const response = await request.put(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns updated template with NO exercises', async () => {
                const req = {
                    alias: 'test no exercises',
                    description: 'new description no exercises',
                };
                const response = await request.put(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
                const workoutTemplate = response.body;

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
                expect(workoutTemplate).toHaveProperty('exercises');

                expect(workoutTemplate.exercises.length).toStrictEqual(0);
            });

            it('returns updated template with exercises', async () => {
                await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                    exerciseSets: 3,
                });

                const req = {
                    alias: 'test with exercises',
                    description: 'new description with exercises',
                };
                const response = await request.put(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
                const workoutTemplate = response.body;

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
                expect(workoutTemplate).toHaveProperty('exercises');
                expect(workoutTemplate.exercises.length).toBeGreaterThan(0);

                const exercise = workoutTemplate.exercises[0];
                expect(exercise).toHaveProperty('id');
                expect(exercise).toHaveProperty('alias');
                expect(exercise).toHaveProperty('order');
                expect(exercise).toHaveProperty('sets');
            });
        });

        describe('unhappy path', () => {
            let req;

            beforeAll(async () => {
                req = {
                    alias: "new alias",
                    description: "new description",
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                // logout user
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('templateId is string', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/wrongId').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is boolean', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/true').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is not positive', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/-23').send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const req = {
                        alias: 'test 200 code',
                        description: 'new description for 200 code',
                    };
                    const response = await request.put(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/1').send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('delete requests', () => {
        let user;
        let newTemplate;
        let newExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
        });

        describe('unhappy path', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('templateId is string', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is boolean', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is not positive', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/-23');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            it("status code of 200", async () => {
                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);

                // logout user
                await request.get('/logout');

                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted template with NO exercises', async () => {
                const { newTemplate } = await setUp();

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);

                // logout user
                await request.get('/logout');

                const workoutTemplate = response.body;

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
                expect(workoutTemplate).toHaveProperty('exercises');

                expect(workoutTemplate.exercises.length).toStrictEqual(0);
            });

            it('returns deleted template with exercises', async () => {
                const { newTemplate, newExercise } = await setUp();

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                    exerciseSets: 3,
                });

                const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);

                // logout user
                await request.get('/logout');

                const workoutTemplate = response.body;

                expect(workoutTemplate).toHaveProperty('id');
                expect(workoutTemplate).toHaveProperty('alias');
                expect(workoutTemplate).toHaveProperty('description');
                expect(workoutTemplate).toHaveProperty('exercises');
                expect(workoutTemplate.exercises.length).toBeGreaterThan(0);

                const exercise = workoutTemplate.exercises[0];
                expect(exercise).toHaveProperty('id');
                expect(exercise).toHaveProperty('alias');
                expect(exercise).toHaveProperty('order');
                expect(exercise).toHaveProperty('sets');
            });

        });
    });
});
