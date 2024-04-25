const { request, BASE_ENDPOINT, newUserReq } = require('./testsSetup');

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
        newUser,
    };
};

describe(`${BASE_ENDPOINT}`,  () => {
    describe('post requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                await setUp();

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("returns exercise object", () => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('alias');
                expect(response.body).toHaveProperty('description');
            });

            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        describe('unhappy paths', () => {
            let newUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;

                // Ensure user is logged out
                await request.get('/logout');
            });

            describe('400 error code when', () => {
                it('mandatory parameter is missing', async () => {
                    // alias is missing
                    let response = await request.post(BASE_ENDPOINT).send({
                        description: "Smith",
                    })

                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 error code when', () => {
                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT).send(newUserReq);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });
        });
    });

    describe('get requests', () => {
        beforeAll(async () => {
            await setUp();
        });

        describe("get all exercises", () => {
            it("returns list", async () => {
                const response = await request.get(BASE_ENDPOINT);
                expect(Array.isArray(response.body)).toBe(true);
            });

            it("status code of 200", async () => {
                const response = await request.get(BASE_ENDPOINT);
                expect(response.statusCode).toStrictEqual(200);
            });

            it('exercise object has id, alias, and description properties', async () => {
                const response = await request.get(BASE_ENDPOINT);

                const exerciseObject = response.body[0];

                expect(exerciseObject).toHaveProperty('id');
                expect(exerciseObject).toHaveProperty('alias');
                expect(exerciseObject).toHaveProperty('description');
            });
        });
    });
});
