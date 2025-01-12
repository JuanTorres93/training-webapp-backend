const {
    request,
    BASE_ENDPOINT,
    successfulPostRequest,
    otherUserName,
    newUserRequestNoOauth: newUserReq,
    setUp,
} = require('./testsSetup.js');

describe(`${BASE_ENDPOINT}/{userId}`, () => {
    describe('post requests', () => {
        let response;
        let newUser;

        beforeAll(async () => {
            const setupInfo = await setUp();
            newUser = setupInfo.newUser;

            // login user
            await request.post('/login').send({
                username: newUserReq.username,
                password: newUserReq.password,
            });

            response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send(successfulPostRequest);
        });

        describe("happy path", () => {
            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            })

            it('returns a weight object', () => {
                expect(response.body).toHaveProperty('user_id');
                expect(response.body).toHaveProperty('date');
                expect(response.body).toHaveProperty('value');
            })

        });

        describe('unhappy paths', () => {
            describe('400 error when', () => {
                it('weight is not a number', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send({
                        ...successfulPostRequest,
                        value: 'not a number',
                    });

                    expect(response.statusCode).toStrictEqual(400);
                });

                it('weight is not provided', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send({
                        ...successfulPostRequest,
                        value: undefined,
                    });

                    expect(response.statusCode).toStrictEqual(400);
                });

                it('date is not provided', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send({
                        ...successfulPostRequest,
                        date: undefined,
                    });

                    expect(response.statusCode).toStrictEqual(400);
                });

                it('date is not a date', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send({
                        ...successfulPostRequest,
                        date: 'not a date',
                    });

                    expect(response.statusCode).toStrictEqual(400);
                });

                it('date is not a valid date', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send({
                        ...successfulPostRequest,
                        date: '2021-02-30',
                    });

                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userId is not an UUID', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/notUUID').send({
                        ...successfulPostRequest,
                    });

                    expect(response.statusCode).toStrictEqual(400);
                })
            })

            describe('409 error when', () => {
                it('weight for that date already exists', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send(successfulPostRequest);
                    expect(response.statusCode).toStrictEqual(409);
                });
            })

            // NOTE: These are last because they require the user to be logged out and logged in as another user
            describe('401 error when', () => {
                beforeAll(async () => {
                    // logout user
                    await request.get('/logout');
                });

                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send(successfulPostRequest);
                    expect(response.statusCode).toStrictEqual(401);
                })
            })

            describe('403 error when', () => {
                it('trying to add weight to another user', async () => {

                    // login other user
                    await request.post('/login').send({
                        username: otherUserName,
                        password: newUserReq.password,
                    });

                    const response = await request.post(BASE_ENDPOINT + `/${newUser.id}`).send(successfulPostRequest);
                    expect(response.statusCode).toStrictEqual(403);


                    // logout user
                    await request.get('/logout');
                });
            })

        });
    });

    describe('get requests', () => {
        let response;
        let newUser;
        let otherUser;

        beforeAll(async () => {
            const setupInfo = await setUp();
            newUser = setupInfo.newUser;
            otherUser = setupInfo.otherUser;

            // login user
            await request.post('/login').send({
                username: newUserReq.username,
                password: newUserReq.password,
            });

            // add weight
            await request.post(BASE_ENDPOINT + `/${newUser.id}`).send(successfulPostRequest);

            response = await request.get(BASE_ENDPOINT + `/${newUser.id}`);
        });

        describe("happy path", () => {

            it('returns 200 status code', () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns an array', () => {
                expect(Array.isArray(response.body)).toStrictEqual(true);
            });

            it('returns an array of weight objects', () => {
                response.body.forEach(weight => {
                    expect(weight).toHaveProperty('user_id');
                    expect(weight).toHaveProperty('date');
                    expect(weight).toHaveProperty('value');
                });
            });
        });

        describe("unhappy path", () => {
            describe('400 error when', () => {
                it('userId is not an UUID', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/notUUID');
                    expect(response.statusCode).toStrictEqual(400);
                });
            })

            // NOTE: These are last because they require the user to be logged out and logged in as another user
            describe('401 error when', () => {
                it('user is not logged in', async () => {
                    await request.get('/logout');
                    response = await request.get(BASE_ENDPOINT + `/${newUser.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 error when', () => {
                it('trying to get weights for another user', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: otherUserName,
                        password: newUserReq.password,
                    });

                    response = await request.get(BASE_ENDPOINT + `/${newUser.id}`);
                    expect(response.statusCode).toStrictEqual(403);
                });
            });
        });
    });
});
