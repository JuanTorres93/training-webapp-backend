const {
    request,
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    newUserReq,
    exercises,
    initExercisesTableInDb,
    addWorkoutsAndExercises,
    getExercisesIds,
    setUp,
} = require('./testsSetup');

describe(`${BASE_ENDPOINT}` + '/{workoutId}', () => {
    let id;
    let exercisesIds = {};

    const createWorkoutRequest = {
        name: "workout_with_exercises",
        description: "This is the description for a workout with exercises",
    };

    beforeAll(async () => {
        // Test's set up
        await setUp();
        await initExercisesTableInDb();

        // login user
        await request.post('/login').send({
            username: newUserReq.username,
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

    describe('post requests', () => {
        const addExerciseRequest = {
            exerciseId: exercisesIds[exercises[0][0]],
            exerciseSet: 1,
            reps: 3,
            weight: 40,
            time_in_seconds: 70,
        };

        beforeAll(async () => {
            // Added here due to async problems
            addExerciseRequest.exerciseId = exercisesIds[exercises[0][0]];
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                response = await request.post(BASE_ENDPOINT + `/${id}`).send(addExerciseRequest);
            });

            afterAll(async () => {
                // Logout user
                await request.get('/logout');
            });

            it('returns exercise', () => {
                expect(response.body).toHaveProperty('exerciseId');
                expect(response.body).toHaveProperty('exerciseSet');
                expect(response.body).toHaveProperty('reps');
                expect(response.body).toHaveProperty('weight');
                expect(response.body).toHaveProperty('time_in_seconds');
            });

            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        describe('unhappy paths', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('400 response when', () => {
                it('workoutId is string', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/wrongId').send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutId is boolean', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/true').send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutId is not positive', async () => {
                    const response = await request.post(BASE_ENDPOINT + '/-34').send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('mandatory body parameter is missing', async () => {
                    // exerciseId is missing
                    let res = await request.post(BASE_ENDPOINT + `/${id}`).send({
                        exerciseSet: 1,
                        reps: 1,
                        weight: 1,
                        time_in_seconds: 1,
                    })

                    expect(res.statusCode).toStrictEqual(400);

                    // exerciseSet is missing
                    res = await request.post(BASE_ENDPOINT + `/${id}`).send({
                        exerciseId: 1,
                        reps: 1,
                        weight: 1,
                        time_in_seconds: 1,
                    })

                    expect(res.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${id}`).send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to post exercise to another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.post(BASE_ENDPOINT + `/${id}`).send(addExerciseRequest);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutId is valid but it does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.post(BASE_ENDPOINT + `/` + uuid).send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('workoutId is valid and exists, but exercise with that id does not exist', async () => {
                    // Valid UUID but (probably) not existing in the database
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.post(BASE_ENDPOINT + `/${id}`).send({
                        ...addExerciseRequest,
                        exerciseId: uuid,
                    });
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('get requests', () => {
        let workoutId;

        beforeAll(async () => {
            await setUp();
            await initExercisesTableInDb();

            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log("EEERROOOOOOOR")
                console.log(error);
            }

            const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
            workoutId = pushResponse.body.id;
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                response = await request.get(BASE_ENDPOINT + `/${workoutId}`);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('workout object has id, name, exercises and description properties', () => {
                const workoutObject = response.body;

                expect(workoutObject).toHaveProperty('id');
                expect(workoutObject).toHaveProperty('name');
                expect(workoutObject).toHaveProperty('description');
                expect(workoutObject).toHaveProperty('exercises');
            });
        });

        describe('uphappy paths', () => {
            beforeAll(async () => {
                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            describe('400 response when', () => {
                it('workoutId is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutId is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutId is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.get(BASE_ENDPOINT + `/${workoutId}`);
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

                    const response = await request.get(BASE_ENDPOINT + `/${workoutId}`);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutId is valid but workout with that id does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.get(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put request', () => {
        let workoutId;

        const putBodyRequest = {
            name: "updated name",
            description: "updated description",
        };

        beforeAll(async () => {
            await setUp();
            await initExercisesTableInDb();

            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log(error);
            }

            const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
            workoutId = pushResponse.body.id;
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                response = await request.put(BASE_ENDPOINT + `/${workoutId}`).send(putBodyRequest);
            });

            afterAll(async () => {
                // Logout user
                await request.get('/logout');
            });

            it('returns updated workout', () => {
                const updatedworkout = response.body;

                expect(updatedworkout.id).toStrictEqual(workoutId);
                expect(updatedworkout.name).toStrictEqual(putBodyRequest.name);
                expect(updatedworkout.description).toStrictEqual(putBodyRequest.description);
                expect(updatedworkout).toHaveProperty('exercises');

            });

            it('returns 200 status code', () => {
                expect(response.statusCode).toStrictEqual(200);

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

            describe('returns 400 error code when', () => {
                it('workoutid is string', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/wrongId').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is boolean', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/true').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is not positive', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/-23').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.put(BASE_ENDPOINT + `/${workoutId}`).send(putBodyRequest);
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

                    const response = await request.put(BASE_ENDPOINT + `/${workoutId}`).send(putBodyRequest);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.put(BASE_ENDPOINT + '/' + uuid).send({
                        ...putBodyRequest,
                        name: 'updated name with put modified',
                        description: 'updated_description_with_put_modified',
                    });
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('delete requests', () => {
        // In this suite unhappy path is tested first in order to preserve the
        // entry in the database
        let workoutId;
        let pushWorkout;

        beforeAll(async () => {
            await setUp();
            await initExercisesTableInDb();

            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log(error);
            }

            const { pushResponse } = await addWorkoutsAndExercises(exercisesIds);
            pushWorkout = pushResponse.body;
            workoutId = pushResponse.body.id;
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

            describe('returns 400 error code when', () => {
                it('workoutid is string', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is boolean', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('workoutid is not positive', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/-23');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(BASE_ENDPOINT + `/${workoutId}`)
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to delete another user\'s workout', async () => {
                    // login other user
                    await request.post('/login').send({
                        username: OTHER_USER_ALIAS,
                        password: newUserReq.password,
                    });

                    const response = await request.delete(BASE_ENDPOINT + `/${workoutId}`)

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    // valid UUID that is unlikely to be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.delete(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                response = await request.delete(BASE_ENDPOINT + `/${workoutId}`)
            });

            afterAll(async () => {
                // Logout user
                await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted workout', () => {
                const deletedworkout = response.body;

                expect(deletedworkout.id).toStrictEqual(workoutId);
                expect(deletedworkout.name).toStrictEqual(pushWorkout.name);
                expect(deletedworkout.description).toStrictEqual(pushWorkout.description);
                expect(deletedworkout).toHaveProperty('exercises');
            });

        });
    });
});