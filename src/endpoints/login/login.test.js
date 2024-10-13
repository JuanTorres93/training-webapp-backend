const {
    request,
    BASE_ENDPOINT,
    USER_ALIAS,
    USER_PASSWORD,
    setUp,
} = require('./testsSetup');

describe(BASE_ENDPOINT, () => {
    describe('post requests', () => {
        beforeAll(async () => {
            const setUpInfo = await setUp();
        });

        describe('happy path', () => {
            let response;
            let req;

            beforeAll(async () => {
                req = {
                    username: USER_ALIAS,
                    password: USER_PASSWORD,
                };
                response = await request.post(BASE_ENDPOINT).send(req);
            });

            it('returns 200 status code', () => {
                expect(response.status).toStrictEqual(200);
            });

            it('user info is appended to request', () => {
                const userInfo = response.body.user;

                expect(userInfo).toHaveProperty('id');
                expect(userInfo).toHaveProperty('alias');
                expect(userInfo).toHaveProperty('email');
                expect(userInfo).toHaveProperty('last_name');
                expect(userInfo).toHaveProperty('second_last_name');
                expect(userInfo).toHaveProperty('img');

                expect(userInfo).not.toHaveProperty('password');
            });
        });

        describe('unhappy path', () => {
            describe('400 error when', () => {
                it('username parameter is missing', async () => {
                    const response = await request.post(BASE_ENDPOINT).send({
                        password: USER_PASSWORD,
                    });
                    expect(response.status).toStrictEqual(400);
                });

                it('password parameter is missing', async () => {
                    const response = await request.post(BASE_ENDPOINT).send({
                        username: USER_ALIAS,
                    });
                    expect(response.status).toStrictEqual(400);
                });

                it('password is not strong', async () => {
                    let response = await request.post(BASE_ENDPOINT).send({
                        username: USER_ALIAS,
                        password: 'password',
                    });
                    expect(response.status).toStrictEqual(400);

                    response = await request.post(BASE_ENDPOINT).send({
                        username: USER_ALIAS,
                        password: 'Password',
                    });
                    expect(response.status).toStrictEqual(400);

                    response = await request.post(BASE_ENDPOINT).send({
                        username: USER_ALIAS,
                        password: 'p@ssword',
                    });
                    expect(response.status).toStrictEqual(400);

                    response = await request.post(BASE_ENDPOINT).send({
                        username: USER_ALIAS,
                        password: 'p4ssword',
                    });
                    expect(response.status).toStrictEqual(400);
                });
            });
        });
    });
});
