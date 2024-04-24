const { request, BASE_ENDPOINT, 
        exercises, initExercisesTableInDb, 
        addWorkoutsAndExercises, getExercisesIds } = require('./testsSetup');

const successfulPostRequest = {
    alias: "first_test_workout",
    description: "This is the description for a test workout",
}

// Empty database before starting tests
const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/exercises/truncate');

    // Fill database with some exercises to be able to add them to workouts
    // await initExercisesTableInDb();
}

describe(`${BASE_ENDPOINT}`,  () => {
    beforeAll(async () => {
        await setUp();
    });

    describe('post requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            it("returns workout object", () => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('alias');
                expect(response.body).toHaveProperty('description');
                expect(response.body).toHaveProperty('exercises');
            });

            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        describe('unhappy paths', () => {
            it('400 response when mandatory parameter is missing', async () => {
                // alias is missing
                let response = await request.post(BASE_ENDPOINT).send({
                    description: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);
            });
        });
    });

    describe('get requests', () => {
        let response;
        let exercisesIds;

        beforeAll(async () => {
            await setUp();
            await initExercisesTableInDb();
            exercisesIds = await getExercisesIds();

            await addWorkoutsAndExercises(exercisesIds);
        });

        beforeEach(async () => {
            response = await request.get(BASE_ENDPOINT);
        });

        describe("get all workouts", () => {
            it("returns list", async () => {
                expect(Array.isArray(response.body)).toBe(true);
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('workout object has id, alias, description and exercises properties', () => {
                const workoutObject = response.body[0];

                expect(workoutObject).toHaveProperty('id');
                expect(workoutObject).toHaveProperty('alias');
                expect(workoutObject).toHaveProperty('description');
                expect(workoutObject).toHaveProperty('exercises');
            });
        });
    });
});


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

        // Create new workout
        const response = await request.post(BASE_ENDPOINT).send(createWorkoutRequest);

        id = response.body.id;

        try {
            exercisesIds = await getExercisesIds();
        } catch (error) {
            console.log("EEERROOOOOOOR")
            console.log(error);
        }
    });

    describe('post requests', () => {
        let response;

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
                
            response = await request.post(BASE_ENDPOINT + `/${id}`).send(addExerciseRequest);
        });

        describe('happy path', () => {
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
        let response;
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

            response = await request.get(BASE_ENDPOINT + `/${workoutId}`);
        });

        describe('happy path', () => {
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
                response = await request.put(BASE_ENDPOINT + `/${workoutId}`).send(putBodyRequest);
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
                response = await request.delete(BASE_ENDPOINT + `/${workoutId}`)
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

        workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
        workout = workout.body;
        initialExercise = workout.exercises[0];
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

                workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
                workout = workout.body;
                initialExercise = workout.exercises[0];
            });

            it('updates only reps', async () => {
                const req = {
                    exerciseSet: 1,
                    reps: 88,
                };

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

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

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

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

                const response = await request.put(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`
                ).send(req);

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

            workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
            workout = workout.body;
            initialExercise = workout.exercises[0];
        });

        describe('unhappy path', () => {
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
                response = await request.delete(BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}`)
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

describe(`${BASE_ENDPOINT}` + '/{workoutId}/exercises/{exerciseId}/{exerciseSet}', () => {
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

            workout = await request.get(BASE_ENDPOINT + `/${workoutId}`);
            workout = workout.body;
            initialExercise = workout.exercises[0];
        });

        describe('unhappy path', () => {
            describe('returns 400 error code when', () => {
                it('exerciseset is string', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/${initialExercise.id}/wrongId`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseset is boolean', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/${initialExercise.id}/true`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseset is not positive', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/${initialExercise.id}/-23`
                    );
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('workoutid is valid but workout with that id does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + '/1' + `/exercises/${initialExercise.id}/1`
                    );
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/1/1`
                    );
                    expect(response.statusCode).toStrictEqual(404);
                });

                it('exerciseSet is valid but exercise with that set does not exist', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}` + `/exercises/${initialExercise.id}/1111`
                    );

                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });

        describe('happy path', () => {
            let response;
            
            beforeAll(async () => {
                response = await request.delete(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
                )
            });
            
            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });
            
            it('returns deleted exercise', () => {
                const deletedExercise = response.body;
                
                expect(deletedExercise.exerciseId).toStrictEqual(initialExercise.id);
                expect(deletedExercise.exerciseSet).toStrictEqual(initialExercise.set);
                expect(deletedExercise.reps).toStrictEqual(initialExercise.reps);
                expect(deletedExercise.weight).toStrictEqual(initialExercise.weight);
                expect(deletedExercise.time_in_seconds).toStrictEqual(initialExercise.time_in_seconds);
            });
        });
    });
});