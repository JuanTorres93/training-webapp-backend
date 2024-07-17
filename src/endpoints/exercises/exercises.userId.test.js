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
        newUser,
        newExercise,
        otherUser,
    };
};

describe(`${BASE_ENDPOINT}` + '/all/{userId}',  () => {
    let newExercise;

    describe('get requests', () => {
        describe('happy path', () => {
            let response;
            let newUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;
                newUser = setUpInfo.newUser;

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                // Test response
                response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it("returns a list", () => {
                expect(Array.isArray(response.body)).toStrictEqual(true);
            });

            it('exercise object has id, name, and description properties', () => {
                const exerciseObject = response.body[0];

                expect(exerciseObject).toHaveProperty('id');
                expect(exerciseObject).toHaveProperty('name');
                expect(exerciseObject).toHaveProperty('description');
            });
        });

        describe('uphappy paths', () => {
            let response;
            let newUser;
            let newExercise;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;
                newUser = setUpInfo.newUser;

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');

                // Test response
                response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);
            });

            describe('400 response when', () => {
                it('userId is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/all/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userId is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/all/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userId is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/all/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });


            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to read another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.get(BASE_ENDPOINT + `/all/${newUser.id}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('userId is valid but user with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/all/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

});