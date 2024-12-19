const {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    request,
    newUserReq,
    reqNewTemplate,
    setUp,
} = require('./testsSetup');

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
                    username: newUserReq.username,
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

            it('returns template object when it DO HAVE exercises', async () => {
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

            it('returns template object when it has NO exercises', async () => {
                // IMPORTANT: This test must be the last one to run because it deletes the exercise in the template
                await request.delete(BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/1`);

                const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
                const workoutTemplateObject = response.body;

                expect(workoutTemplateObject).toHaveProperty('id');
                expect(workoutTemplateObject).toHaveProperty('alias');
                expect(workoutTemplateObject).toHaveProperty('description');
                expect(workoutTemplateObject).toHaveProperty('exercises');

                expect(workoutTemplateObject.exercises.length).toStrictEqual(0);
            });
        });

        describe('unhappy path', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.username,
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
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.get(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('post requests', () => {
        let user;
        let newTemplate;
        let newExercise;
        let reqNewTemplate;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
            reqNewTemplate = setUpInfo.reqNewTemplate;
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
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                // delete template and recreate it
                // This is done because template is created in setUp function and this
                // very endpoint is in charge of creating them
                await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);
                response = await request.post(BASE_ENDPOINT).send(reqNewTemplate);
                newTemplate = response.body;

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
                    username: newUserReq.username,
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

            describe('403 response when', () => {
                it('trying to add exercise to another user\'s workout template', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but it does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.post(BASE_ENDPOINT + `/` + uuid).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('templateId is valid and exists, but exercise with that id does not exist', async () => {
                    // Valid UUID but (probably) not existing in the database
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                        ...req,
                        exerciseId: uuid,
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
                    username: newUserReq.username,
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

            it('returns updated template with exercises', async () => {
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

            it('returns updated template with NO exercises', async () => {
                // IMPORTANT: This test must be the last one to run because it deletes the exercise in the template
                await request.delete(BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/1`);

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
                    username: newUserReq.username,
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

            describe('403 response when', () => {
                it('trying to update exercise in another user\'s workout template', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const req = {
                        alias: 'test 200 code',
                        description: 'new description for 200 code',
                    };
                    const response = await request.put(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.put(BASE_ENDPOINT + '/' + uuid).send(req);
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
                    username: newUserReq.username,
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

            describe('403 response when', () => {
                it('trying to delete another user\'s workout template', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.delete(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            it("status code of 200", async () => {
                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                const response = await request.delete(BASE_ENDPOINT + `/${newTemplate.id}`);

                // logout user
                await request.get('/logout');

                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted template with exercises', async () => {
                const { newTemplate } = await setUp();

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.username,
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
                expect(workoutTemplate.exercises.length).toBeGreaterThan(0);

                const exercise = workoutTemplate.exercises[0];
                expect(exercise).toHaveProperty('id');
                expect(exercise).toHaveProperty('alias');
                expect(exercise).toHaveProperty('order');
                expect(exercise).toHaveProperty('sets');
            });

            it('returns deleted template with NO exercises', async () => {
                // IMPORTANT: This test must be the last one to run because it deletes the exercise in the template
                const { newTemplate, newExercise } = await setUp();

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                await request.delete(BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/1`);

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

        });
    });
});
