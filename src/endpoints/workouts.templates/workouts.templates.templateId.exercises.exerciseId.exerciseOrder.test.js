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

    // Add exercise to template
    const addedExerciseResponse = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
        exerciseId: newExercise.id,
        exerciseOrder: 1,
        exerciseSets: 3,
    });
    const addedExercise = addedExerciseResponse.body;

    // logout user
    await request.get('/logout');

    return {
        user,
        newTemplate,
        newExercise,
        addedExercise,
    };
};

describe(BASE_ENDPOINT + '/{templateId}/exercises/{exerciseId}/{exerciseOrder}', () => {
    describe('put request', () => {
        describe('happy path', () => {
            let newTemplate;
            let newExercise;
            let addedExercise;

            beforeEach(async () => {
                const setUpInfo = await setUp();

                newTemplate = setUpInfo.newTemplate;
                newExercise = setUpInfo.newExercise;
                addedExercise = setUpInfo.addedExercise;
            });

            it('returns 200 status code', async () => {
                const req = {
                    exerciseOrder: 9,
                    exerciseSets: 8,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                ).send(req);
                
                // logout user
                await request.get('/logout');

                expect(response.statusCode).toStrictEqual(200);
            });

            it('updates only exercise order', async () => {
                const req = {
                    newExerciseOrder: 9,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                ).send(req);
                
                // logout user
                await request.get('/logout');

                const updatedWorkoutTemplateExercise = response.body;

                expect(updatedWorkoutTemplateExercise.exerciseOrder).not.toEqual(addedExercise.exerciseOrder);
                expect(updatedWorkoutTemplateExercise.exerciseSets).toStrictEqual(addedExercise.exerciseSets);
                expect(updatedWorkoutTemplateExercise.id).toStrictEqual(addedExercise.id);
                expect(updatedWorkoutTemplateExercise.alias).toStrictEqual(addedExercise.alias);
            });

            it('updates only exercise sets', async () => {
                const req = {
                    exerciseSets: 9,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                ).send(req);
                
                // logout user
                await request.get('/logout');

                const updatedWorkoutTemplateExercise = response.body;

                expect(updatedWorkoutTemplateExercise.exerciseOrder).toStrictEqual(addedExercise.exerciseOrder);
                expect(updatedWorkoutTemplateExercise.exerciseSets).not.toEqual(addedExercise.exerciseSets);
                expect(updatedWorkoutTemplateExercise.id).toStrictEqual(addedExercise.id);
                expect(updatedWorkoutTemplateExercise.alias).toStrictEqual(addedExercise.alias);
            });
        });

        describe('unhappy path', () => {
            let req;
            let newTemplate;
            let newExercise;
            let addedExercise;

            beforeAll(async () => {
                req = {
                    exerciseOrder: 8,
                    exerciseSets: 8,
                };

                const setUpInfo = await setUp();

                newTemplate = setUpInfo.newTemplate;
                newExercise = setUpInfo.newExercise;
                addedExercise = setUpInfo.addedExercise;

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('templateid is string', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/wrongId' + `/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateid is boolean', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/true' + `/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateid is not positive', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/-23' + `/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is string', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/wrongId/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/true/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/-23/${addedExercise.exerciseOrder}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is string', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/wrongId`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is boolean', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/true`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is not positive', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/-23`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const req = {
                        exerciseOrder: 9,
                        exerciseSets: 8,
                    };

                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    ).send(req);
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
                        exerciseOrder: 9,
                        exerciseSets: 8,
                    };

                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    ).send(req);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateid is valid but template with that id does not exist', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/1' + `/exercises/${newExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/1`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('delete requests', () => {
        let newTemplate;
        let newExercise;
        let addedExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
            addedExercise = setUpInfo.addedExercise;
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
                it('templateid is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/wrongId' + `/exercises/${addedExercise.id}/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateid is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/true' + `/exercises/${addedExercise.id}/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateid is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/-23' + `/exercises/${addedExercise.id}/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/wrongId/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/true/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/-23/${addedExercise.order}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/wrongId`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/true`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseOrder is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/${addedExercise.exerciseOrder}/-23`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const endpoint = BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`
                    const response = await request.delete(endpoint)
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('404 response when', () => {
                it('templateid is valid but template with that id does not exist', async () => {
                    const endpoint = BASE_ENDPOINT + '/1' + `/exercises/${addedExercise.exerciseId}/${addedExercise.exerciseOrder}`;
                    const response = await request.delete(endpoint);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${newTemplate.id}` + `/exercises/1/${addedExercise.exerciseOrder}`
                    );
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            let newTemplate;
            let newExercise;
            let addedExercise;

            beforeEach(async () => {
                const setUpInfo = await setUp();

                newTemplate = setUpInfo.newTemplate;
                newExercise = setUpInfo.newExercise;
                addedExercise = setUpInfo.addedExercise;
            });

            it("status code of 200", async () => {
                const endpoint = BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.delete(endpoint)

                // logout user
                await request.get('/logout');

                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted exercise', async () => {
                const endpoint = BASE_ENDPOINT + `/${newTemplate.id}/exercises/${newExercise.id}/${addedExercise.exerciseOrder}`

                // login user. HERE CAUSE setUp ends loggin out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.delete(endpoint)

                // logout user
                await request.get('/logout');

                const deletedExercise = response.body;

                expect(deletedExercise.workoutTemplateId).toStrictEqual(addedExercise.workoutTemplateId);
                expect(deletedExercise.exerciseId).toStrictEqual(addedExercise.exerciseId);
                expect(deletedExercise.exerciseSets).toStrictEqual(addedExercise.exerciseSets);
                expect(deletedExercise.exerciseOrder).toStrictEqual(addedExercise.exerciseOrder);
            });
        });
    });
});
