const { request, BASE_ENDPOINT, createNewTemplateRequest } = require('./setup');

const _setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');


    const response = await request.post('/users').send({
        alias: 'test user',
        email: 'test@domain.com',
        password: 'test password',
    });
    const user = response.body;

    return {
        user,
    };
};

// describe('get requests', () => {
// 
// });

describe('post requests', () => {
    let user;

    beforeAll(async () => {
        const setUpInfo = await _setUp();

        user = setUpInfo.user;
    });

    describe('happy path', () => {
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
    });
});
