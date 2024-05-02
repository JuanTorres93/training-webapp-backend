const { request, BASE_ENDPOINT, newUserReq } = require('./testsSetup');

OTHER_USER_ALIAS = 'other user';

const successfulPostRequest = {
    alias: "first_test_exercise",
    description: "This is the description for a test exercise",
}

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');

    // Add user to db
    const newUserResponse = await request.post('/users').send(newUserReq);
    const newUser = newUserResponse.body;

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

    // Add exercise to db
    const newExercisesResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
    const newExercise = newExercisesResponse.body;

    // logout user
    await request.get('/logout');

    return {
        newExercise,
        otherUser,
    };
};

describe(`${BASE_ENDPOINT}` + '/{exerciseId}',  () => {
    let newExercise;

    describe('get requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Test response
                response = await request.get(BASE_ENDPOINT + `/${newExercise.id}`);
            });

            it("status code of 200", () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('exercise object has id, alias, and description properties', () => {
                const exerciseObject = response.body;

                expect(exerciseObject).toHaveProperty('id');
                expect(exerciseObject).toHaveProperty('alias');
                expect(exerciseObject).toHaveProperty('description');
            });
        });

        describe('uphappy paths', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');

                // Test response
                response = await request.get(BASE_ENDPOINT + `/${newExercise.id}`);
            });

            describe('400 response when', () => {
                it('exerciseId is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseId is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseId is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put request', () => {
        const putBodyRequest = {
            alias: "updated alias",
            description: "updated description",
        };

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                // Test response
                response = await request.put(BASE_ENDPOINT + `/${newExercise.id}`).send(putBodyRequest);

                // Logout user
                await request.get('/logout');
            });

            it('returns updated exercise', () => {
                const updatedExercise = response.body;

                expect(updatedExercise.id).toStrictEqual(newExercise.id);
                expect(updatedExercise.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedExercise.description).toStrictEqual(putBodyRequest.description);

            });

            it('returns 200 status code', () => {
                expect(response.statusCode).toStrictEqual(200);

            });
        });

        describe('unhappy path', () => {
            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('exerciseid is string', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/wrongId').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/true').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/-23').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.put(BASE_ENDPOINT + `/${newExercise.id}`).send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to update another user\'s exercise', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.put(BASE_ENDPOINT + `/${newExercise.id}`).send(putBodyRequest);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('exerciseid is valid but exercise with that id does not exist', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/1').send({
                        ...putBodyRequest,
                        alias: 'updated alias with put modified',
                        description: 'updated_description_with_put_modified',
                    });
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });


    describe('delete requests', () => {
        // In this suite unhappy path is tested first in order to preserve the
        // entry in the database
        describe('unhappy path', () => {
            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('exerciseid is string', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/-23');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(BASE_ENDPOINT + `/${newExercise.id}`)
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to update another user\'s exercise', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.delete(BASE_ENDPOINT + `/${newExercise.id}`)

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('exerciseid is valid but exercise with that id does not exist', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
            
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                // Test response
                response = await request.delete(BASE_ENDPOINT + `/${newExercise.id}`)
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted exercise', () => {
                const deletedexercise = response.body;

                expect(deletedexercise.id).toStrictEqual(newExercise.id);
                expect(deletedexercise.alias).toStrictEqual(successfulPostRequest.alias);
                expect(deletedexercise.description).toStrictEqual(successfulPostRequest.description);
            });
            
        });
    });
});