const { request, BASE_ENDPOINT, createNewTemplateRequest, newUserReq } = require('./testsSetup');

OTHER_USER_ALIAS = 'other user';

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');
    await request.get('/exercises/truncate');

    // Add user to db
    const userResponse = await request.post('/users').send(newUserReq);
    const user = userResponse.body;

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

    // Add template to db
    const reqNewTemplate = createNewTemplateRequest(user.id, 'setup template', 'set up template description')
    const responseNewTemplate = await request.post(BASE_ENDPOINT).send(reqNewTemplate);
    const newTemplate = responseNewTemplate.body;

    // Add exercise to db
    const exerciseResponse = await request.post('/exercises').send({
        alias: "Pull up",
        description: "Fucks your shoulder",
    });
    const newExercise = exerciseResponse.body;

    // Add exercise to template
    await request.post('/workouts/templates' + `/${newTemplate.id}`).send({
        exerciseId: newExercise.id,
        exerciseOrder: 1,
        exerciseSets: 3,
    });
    

    // logout user
    await request.get('/logout');

    return {
        user,
        newTemplate,
        newExercise,
        otherUser,
    };
};


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
                    username: newUserReq.alias,
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
                expect(workoutTemplateObject).toHaveProperty('alias');
                expect(workoutTemplateObject).toHaveProperty('description');
                expect(workoutTemplateObject).toHaveProperty('exercises');
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
                    const response = await request.get(BASE_ENDPOINT + '/all/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });
});