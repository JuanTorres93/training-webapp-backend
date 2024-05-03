const { request, BASE_ENDPOINT, newUserReq,
        exercises, initExercisesTableInDb, 
        addWorkoutsAndExercises, getExercisesIds } = require('./testsSetup');

OTHER_USER_ALIAS = 'other user';

// Empty database before starting tests
const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/exercises/truncate');

    // Add user to db
    await request.post('/users').send(newUserReq);

    // Add other user to db
    const otherUserResponse = await request.post('/users').send({
        ...newUserReq,
        alias: OTHER_USER_ALIAS,
        email: 'other@user.com',
    });
    const otherUser = otherUserResponse.body;
}

describe(`${BASE_ENDPOINT}` + '/{workoutId}',  () => {
    let id;
    let exercisesIds = {};

    const createWorkoutRequest = {
        alias: "workout_with_exercises",
        description: "This is the description for a workout with exercises",
    };

    beforeAll(async () => {
        // Test's set up
        await setUp();
        await initExercisesTableInDb();

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
                    username: newUserReq.alias,
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
                    username: newUserReq.alias,
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
                    const response = await request.post(BASE_ENDPOINT + `/1`).send(addExerciseRequest);
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('workoutId is valid and exists, but exercise with that id does not exist', async () => {
                    const response = await request.post(BASE_ENDPOINT + `/${id}`).send({
                        ...addExerciseRequest,
                        exerciseId: 1,
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
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                // TODO NEXT INVESTIGAR POR QUÉ FALLA DESPUÉS DE IMPLEMENTAR 403 RESPONSE
                response = await request.get(BASE_ENDPOINT + `/${workoutId}`);
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
                it('trying to update another user\'s exercise', async () => {
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
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put request', () => {
        let workoutId;

        const putBodyRequest = {
            alias: "updated alias",
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
                    username: newUserReq.alias,
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
                expect(updatedworkout.alias).toStrictEqual(putBodyRequest.alias);
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
                    username: newUserReq.alias,
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

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/1').send({
                        ...putBodyRequest,
                        alias: 'updated alias with put modified',
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
                    username: newUserReq.alias,
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

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/1');
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
                expect(deletedworkout.alias).toStrictEqual(pushWorkout.alias);
                expect(deletedworkout.description).toStrictEqual(pushWorkout.description);
                expect(deletedworkout).toHaveProperty('exercises');
            });
            
        });
    });
});