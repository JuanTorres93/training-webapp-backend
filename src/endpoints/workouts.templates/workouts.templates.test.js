const { request, BASE_ENDPOINT, createNewTemplateRequest } = require('./setup');

const _setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');

    // Add user to tb
    const userResponse = await request.post('/users').send({
        alias: 'test user',
        email: 'test@domain.com',
        password: 'test password',
    });
    const user = userResponse.body;

    // Add template to dbv
    const reqNewTemplate = createNewTemplateRequest(user.id, 'setup template', 'set up template description')
    const responseNewTemplate = await request.post(BASE_ENDPOINT).send(reqNewTemplate);
    const newTemplate = responseNewTemplate.body;

    return {
        user,
        newTemplate,
    };
};

describe('get requests', () => {
    beforeAll(async () => {
        const setUpInfo = await _setUp();
    });

    describe('happy path', () => {
        it('returns 200 status code', async () => {
            const response = await request.get(BASE_ENDPOINT);

            expect(response.statusCode).toStrictEqual(200);
        });

        it("returns list", async () => {
            const response = await request.get(BASE_ENDPOINT);

            expect(Array.isArray(response.body)).toBe(true);
        });

        // TODO test returned object when post request for creating them is available
        // it('workout template object has correct properties', async () => {
            // const response = await request.get(BASE_ENDPOINT);
            // const workoutTemplate = response.body[0];
// 
            // expect(workoutTemplate).toHaveProperty('id');
            // expect(workoutTemplate).toHaveProperty('exercises');
            // expect(workoutTemplate).toHaveProperty('alias');
            // expect(workoutTemplate).toHaveProperty('description');
        // });
    });

    // describe('unhappy path', () => {
    //     // TODO implement 401 and 403 cases
    // });
});

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
