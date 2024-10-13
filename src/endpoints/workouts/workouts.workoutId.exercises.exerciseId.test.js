const {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    request,
    newUserReq,
    initExercisesTableInDb,
    addWorkoutsAndExercises,
    getExercisesIds,
    setUp,
} = require('./testsSetup');

describe(`${BASE_ENDPOINT}` + '/{workoutId}/exercises/{exerciseId}', () => {
    let workout;
    let initialExercise;
    let exercisesIds = {};

    beforeAll(async () => {
        // Test's set up
        await setUp();
        await initExercisesTableInDb();

        try {
            exercisesIds = await getExercisesIds();
        } catch (error) {
            console.log(error);
        }

        const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
        const workoutId = pushResponse.body.id;

        // login user
        await request.post('/login').send({
            username: newUserReq.alias,
            password: newUserReq.password,
        });

        workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
        workout = workout.body;
        initialExercise = workout.exercises[0];

        // logout user
        await request.get('/logout');
    });

    describe('put requests', () => {
        describe('happy path', () => {
            afterEach(async () => {
                await setUp();
                await initExercisesTableInDb();

                try {
                    exercisesIds = await getExercisesIds();
                } catch (error) {
                    console.log(error);
                }

                const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
                const workoutId = pushResponse.body.id;

                // login user. HERE BECAUSE PREVIOUS CALLS LOGOUT THE USER
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
                workout = workout.body;
                initialExercise = workout.exercises[0];

                // logout user
                await request.get('/logout');

                // login user. HERE BECAUSE PREVIOUS CALLS LOGOUT THE USER
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it('updates only reps', async () => {
                const req = {
                    exerciseSet: 1,
                    reps: 88,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

                // logout user
                await request.get('/logout');

                const updatedWorkout = response.body;
                expect(updatedWorkout.exerciseId).toStrictEqual(initialExercise.id);
                expect(updatedWorkout.exerciseSet).toStrictEqual(initialExercise.set);
                expect(updatedWorkout.reps).not.toEqual(initialExercise.reps);
                expect(updatedWorkout.weight).toStrictEqual(initialExercise.weight);
                expect(updatedWorkout.time_in_seconds).toStrictEqual(initialExercise.time_in_seconds);
            });

            it('updates only weight', async () => {
                const req = {
                    exerciseSet: 1,
                    weight: 88,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

                // logout user
                await request.get('/logout');

                const updatedWorkout = response.body;
                expect(updatedWorkout.exerciseId).toStrictEqual(initialExercise.id);
                expect(updatedWorkout.exerciseSet).toStrictEqual(initialExercise.set);
                expect(updatedWorkout.reps).toStrictEqual(initialExercise.reps);
                expect(updatedWorkout.weight).not.toEqual(initialExercise.weight);
                expect(updatedWorkout.time_in_seconds).toStrictEqual(initialExercise.time_in_seconds);
            });

            it('updates only time_in_seconds', async () => {
                const req = {
                    exerciseSet: 1,
                    time_in_seconds: 88,
                };

                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

                // logout user
                await request.get('/logout');

                const updatedWorkout = response.body;
                expect(updatedWorkout.exerciseId).toStrictEqual(initialExercise.id);
                expect(updatedWorkout.exerciseSet).toStrictEqual(initialExercise.set);
                expect(updatedWorkout.reps).toStrictEqual(initialExercise.reps);
                expect(updatedWorkout.weight).toStrictEqual(initialExercise.weight);
                expect(updatedWorkout.time_in_seconds).not.toEqual(initialExercise.time_in_seconds);
            });
        });

        describe('unhappy path', () => {
            const req = {
                exerciseSet: 1,
                reps: 34,
            };

            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('returns 400 error code when', () => {
                it('workoutid is string', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/wrongId' + `/exercises/${initialExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is boolean', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/true' + `/exercises/${initialExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is not positive', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/-23' + `/exercises/${initialExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is string', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/wrongId`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/true`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/-23`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to update exercise on another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const req = {
                        exerciseSet: 1,
                        reps: 88,
                    };

                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                    ).send(req);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + '/1' + `/exercises/${initialExercise.id}`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.put(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/1`
                    ).send(req);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('delete requests', () => {
        let workout;
        let initialExercise;
        let exercisesIds = {};

        beforeAll(async () => {
            // Test's set up
            await setUp();
            await initExercisesTableInDb();

            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log(error);
            }

            const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
            const workoutId = pushResponse.body.id;

            // login user
            await request.post('/login').send({
                username: newUserReq.alias,
                password: newUserReq.password,
            });

            workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
            workout = workout.body;
            initialExercise = workout.exercises[0];

            // logout user
            await request.get('/logout');
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

            describe('returns 400 error code when', () => {
                it('workoutid is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/wrongId' + `/exercises/${initialExercise.id}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/true' + `/exercises/${initialExercise.id}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/-23' + `/exercises/${initialExercise.id}`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/wrongId`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/true`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/-23`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`)
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to delete exercise on another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.delete(BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`)

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/1' + `/exercises/${initialExercise.id}`
                    );
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/1`
                    );
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                response = await request.delete(BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`)
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted exercise', () => {
                const deletedExercise = response.body[0];

                expect(deletedExercise.exerciseId).toStrictEqual(initialExercise.id);
                expect(deletedExercise.exerciseSet).toStrictEqual(initialExercise.set);
                expect(deletedExercise.reps).toStrictEqual(initialExercise.reps);
                expect(deletedExercise.weight).toStrictEqual(initialExercise.weight);
                expect(deletedExercise.time_in_seconds).toStrictEqual(initialExercise.time_in_seconds);
            });
        });
    });
});
