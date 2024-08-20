const { request, BASE_ENDPOINT, newUserReq,
    exercises, initExercisesTableInDb,
    addWorkoutsAndExercises, getExercisesIds } = require('./testsSetup');

OTHER_USER_ALIAS = 'other user';

const createWorkoutRequest = {
    alias: "workout_with_exercises",
    description: "This is the description for a workout with exercises",
};

// Empty database before starting tests
const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/exercises/truncate');
    await request.get('/users/truncate');
    await request.get('/workouts/templates/truncate');

    // Add user to db
    const userReponse = await request.post('/users').send(newUserReq);
    const user = userReponse.body;

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

    // logout user
    await request.get('/logout');

    return { user, otherUser };
}

describe(`${BASE_ENDPOINT}` + '/last/{templateId}/user/{userId}', () => {
    let id;
    let exercisesIds = {};
    let user, otherUser;
    let template;

    beforeAll(async () => {
        // Test's set up
        const setupInfo = await setUp();
        await initExercisesTableInDb();

        user = setupInfo.user;
        otherUser = setupInfo.otherUser;

        // login user
        await request.post('/login').send({
            username: newUserReq.alias,
            password: newUserReq.password,
        });

        // Create new workout
        const response = await request.post(BASE_ENDPOINT).send(createWorkoutRequest);

        id = response.body.id;

        try {
            exercisesIds = await getExercisesIds();
        } catch (error) {
            console.log(error);
        }

        // logout user
        await request.get('/logout');
    });


    describe('get requests', () => {
        let workoutId;

        beforeAll(async () => {
            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log("EEERROOOOOOOR")
                console.log(error);
            }

            const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);

            // login user
            await request.post('/login').send({
                username: newUserReq.alias,
                password: newUserReq.password,
            });

            const workoutReponse = await request.get('/workouts/' + pushResponse.body.id);
            const workout = workoutReponse.body;
            workoutId = workout.id;

            const exercisesAndSets = {};
            workout.exercises.forEach(exercise => {
                if (!Object.keys(exercisesAndSets).includes(String(exercise.id))) {
                    exercisesAndSets[exercise.id] = 1;
                } else {
                    exercisesAndSets[exercise.id]++;
                }
            });

            // Create new template
            const templateResponse = await request.post('/workouts/templates').send({
                userId: user.id,
                alias: workout.alias,
                description: workout.description,
            });
            template = templateResponse.body;

            // Add exercises to template
            const promises = []
            Object.entries(exercisesAndSets).forEach(([exerciseId, totalSets], i) => {
                const req = {
                    exerciseId: Number.parseInt(exerciseId),
                    exerciseOrder: i + 1,
                    exerciseSets: totalSets,
                };

                promises.push(
                    request.post('/workouts/templates' + `/${template.id}`).send(req)
                );
            });

            await Promise.all(promises);

            // logout user
            await request.get('/logout');
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                const logResponse = await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const ep = BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`

                response = await request.get(ep);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('workout object has id, alias, exercises and description properties', () => {
                const workoutObject = response.body;

                expect(workoutObject).toHaveProperty('id');
                expect(workoutObject).toHaveProperty('alias');
                expect(workoutObject).toHaveProperty('description');
                expect(workoutObject).toHaveProperty('exercises');
            });
        });

        describe('uphappy paths', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('400 response when', () => {
                it('templateId is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/last/wrongId/user/1');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/last/wrongId/user/1');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('templateId is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/last/wrongId/user/1');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.get(BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to read another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.get(BASE_ENDPOINT + `/last/${template.id}/user/${user.id}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('templateId is valid but workout with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/last/1/user/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

});