const {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    request,
    newUserReq,
    setUp,
} = require('./testsSetup');


describe(BASE_ENDPOINT + '/last/user/{userId}/{numberOfWorkouts}', () => {
    describe('get requests', () => {
        let user;
        let newTemplate;
        let newExercise;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
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

            it("status code of 200", async () => {
                const response = await request.get(BASE_ENDPOINT + `/last/user/${user.id}/${1}`);
                expect(response.statusCode).toStrictEqual(200);
            });

            it("returns array", async () => {
                const response = await request.get(BASE_ENDPOINT + `/last/user/${user.id}/${1}`);
                expect(response.body).toBeInstanceOf(Array);
            });

            it("Objects of array have correct keys", async () => {
                const response = await request.get(BASE_ENDPOINT + `/last/user/${user.id}/${1}`);
                const template = response.body[0];
                expect(template).toHaveProperty('template_id');
                expect(template).toHaveProperty('workout_date');
                expect(template).toHaveProperty('workout_name');
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
                    const response = await request.get(BASE_ENDPOINT + `/last/user/${user.id}/${1}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to read another user\'s workout template', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.get(BASE_ENDPOINT + `/last/user/${user.id}/${1}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });
        });
    });
});
