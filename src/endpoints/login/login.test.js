const { request, BASE_ENDPOINT } = require('./testsSetup');

USER_ALIAS = 'test user';
USER_PASSWORD = 'T3st_u$eR_pAss';

const setUp = async () => {
    await request.get('/users/truncate');
    await request.get('/exercises/truncate');
    await request.get('/workouts/truncate');
    await request.get('/workouts/templates/truncate');

    const newUserResponse = await request.post('/users').send({
        alias: USER_ALIAS,
        email: 'test@user.com',
        password: USER_PASSWORD,
    });
    const newUser = newUserResponse.body;

    return {
        newUser,
    };
};

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
