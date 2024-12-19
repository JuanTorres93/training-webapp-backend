const {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    request,
    newUserReq,
    setUp,
} = require('./testsSetup');


describe(`${BASE_ENDPOINT}/all/{userId}`, () => {
    describe('get requests', () => {
        let user;
        let newTemplate;
        let newExercise;
        let otherUser;

        beforeAll(async () => {
            const setUpInfo = await setUp();

            user = setUpInfo.user;
            newTemplate = setUpInfo.newTemplate;
            newExercise = setUpInfo.newExercise;
            otherUser = setUpInfo.otherUser;
        });

        describe('happy path', () => {
            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns list', async () => {
                const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
                const templatesList = response.body;

                expect(templatesList).toBeInstanceOf(Array);
            });

            it('List contains workouts', async () => {
                const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
                const workoutTemplateObject = response.body[0];


                expect(workoutTemplateObject).toHaveProperty('id');
                expect(workoutTemplateObject).toHaveProperty('name');
                expect(workoutTemplateObject).toHaveProperty('description');
                expect(workoutTemplateObject).toHaveProperty('exercises');
            });
        });

        describe('unhappy path', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);
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

                    const response = await request.get(BASE_ENDPOINT + `/all/${user.id}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but template with that id does not exist', async () => {
                    // generate a valid UUID that probably won't be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.get(BASE_ENDPOINT + '/all/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });
});