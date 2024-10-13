const {
    request,
    BASE_ENDPOINT,
    newUserReq,
    createNewTemplateRequest,
    setUp,
} = require('./testsSetup');

describe(BASE_ENDPOINT, () => {
    describe('get requests', () => {
        beforeAll(async () => {
            const setUpInfo = await setUp();
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
                    const response = await request.get(BASE_ENDPOINT);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });
        });

    });

    describe('post requests', () => {
        let user;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
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
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

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

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const req = createNewTemplateRequest(user.id, 'template test', 'template description')
                    const response = await request.post(BASE_ENDPOINT).send(req);

                    expect(response.statusCode).toStrictEqual(401);
                });
            });
        });
    });
});
