const { request, BASE_ENDPOINT, createNewTemplateRequest } = require('./setup');

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');
    await request.get('/exercises/truncate');

    // Add user to tb
    const userResponse = await request.post('/users').send({
        alias: 'test user',
        email: 'test@domain.com',
        password: 'test password',
    });
    const user = userResponse.body;

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

    return {
        user,
        newTemplate,
        newExercise,
    };
};

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
        it("status code of 200", async () => {
            const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
            expect(response.statusCode).toStrictEqual(200);
        });

        it('returns template object when it has no exercises', async () => {
            const response = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
            const workoutTemplateObject = response.body;

            expect(workoutTemplateObject).toHaveProperty('id');
            expect(workoutTemplateObject).toHaveProperty('alias');
            expect(workoutTemplateObject).toHaveProperty('description');
            expect(workoutTemplateObject).toHaveProperty('exercises');

            expect(workoutTemplateObject.exercises.length).toStrictEqual(0);
        });

        it('returns template object when it do have exercises', async () => {
            await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                exerciseId: newExercise.id,
                exerciseOrder: 1,
                exerciseSets: 3,
            });

            const getResponse = await request.get(BASE_ENDPOINT + `/${newTemplate.id}`);
            const workoutTemplateObject = getResponse.body;

            expect(workoutTemplateObject).toHaveProperty('id');
            expect(workoutTemplateObject).toHaveProperty('alias');
            expect(workoutTemplateObject).toHaveProperty('description');
            expect(workoutTemplateObject).toHaveProperty('exercises');
            expect(workoutTemplateObject.exercises.length).toBeGreaterThan(0);

            const exercise = workoutTemplateObject.exercises[0];
            expect(exercise).toHaveProperty('id');
            expect(exercise).toHaveProperty('alias');
            expect(exercise).toHaveProperty('order');
            expect(exercise).toHaveProperty('sets');
        });
    });

    describe('unhappy path', () => {
        describe('404 response when', () => {
            it('templateId is valid but template with that id does not exist', async () => {
                const response = await request.get(BASE_ENDPOINT + '/1');
                expect(response.statusCode).toStrictEqual(404);
            });
        });
    });
});

describe('post requests', () => {
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
        let response;

        beforeAll(async () => {
            const req = {
                exerciseId: newExercise.id,
                exerciseOrder: 1,
                exerciseSets: 3,
            };
            response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send(req);
        });

        it('returns 201 status code', async () => {
            expect(response.statusCode).toStrictEqual(201);
        });

        it('returns workout template object', async () => {
            const workoutTemplateExercise = response.body;

            expect(workoutTemplateExercise).toHaveProperty('workoutTemplateId');
            expect(workoutTemplateExercise).toHaveProperty('exerciseId');
            expect(workoutTemplateExercise).toHaveProperty('exerciseOrder');
            expect(workoutTemplateExercise).toHaveProperty('exerciseSets');
        });
    });

    describe('unhappy path', () => {
        let req;

        beforeAll(() => {
            req = {
                exerciseId: newExercise.id,
                exerciseOrder: 1,
                exerciseSets: 3,
            };
        });

        describe('400 response when', () => {
            it('templateId is string', async () => {
                const response = await request.post(BASE_ENDPOINT + '/wrongId').send(req);
                expect(response.statusCode).toStrictEqual(400);
            });

            it('templateId is boolean', async () => {
                const response = await request.post(BASE_ENDPOINT + '/true').send(req);
                expect(response.statusCode).toStrictEqual(400);
            });

            it('templateId is not positive', async () => {
                const response = await request.post(BASE_ENDPOINT + '/-34').send(req);
                expect(response.statusCode).toStrictEqual(400);
            });

            it('mandatory body parameter is missing', async () => {
                // exerciseId is missing
                let res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseOrder: 1,
                    exerciseSets: 3,
                })

                expect(res.statusCode).toStrictEqual(400);

                // exerciseSets is missing
                res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseId: newExercise.id,
                    exerciseOrder: 1,
                })

                expect(res.statusCode).toStrictEqual(400);

                // exerciseOrder is missing
                res = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    exerciseId: newExercise.id,
                    exerciseSets: 3,
                })

                expect(res.statusCode).toStrictEqual(400);
            });
        });

        describe('404 response when', () => {
            it('templateId is valid but it does not exist', async () => {
                const response = await request.post(BASE_ENDPOINT + `/1`).send(req);
                expect(response.statusCode).toStrictEqual(404);
            });

            it('templateId is valid and exists, but exercise with that id does not exist', async () => {
                const response = await request.post(BASE_ENDPOINT + `/${newTemplate.id}`).send({
                    ...req,
                    exerciseId: 1,
                });
                expect(response.statusCode).toStrictEqual(404);
            });
        });
    });
});
