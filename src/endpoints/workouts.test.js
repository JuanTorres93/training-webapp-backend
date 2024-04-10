
// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../app.js');

const utils = require('../utils/utils.js');
const query = require('../db/index.js').query;

const dbExercises = require('../db/exercises.js');

// true means that it should connect to test db
const app = createApp(true);
const BASE_ENDPOINT = '/workouts'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

const exercises = [
    ['bench press', 'A compound upper body exercise where you lie on a bench and press a barbell upwards, targeting chest, shoulders, and triceps.'],
    ['barbell row', 'An upper body exercise where you bend forward at the hips, pulling a barbell towards your torso, targeting back muscles like lats and rhomboids.'],
    ['pull up', 'A bodyweight exercise where you hang from a bar and pull yourself up until your chin is above the bar, primarily targeting the back, arms, and shoulders.'],
    ['dip', 'A bodyweight exercise where you suspend yourself between parallel bars and lower your body until your upper arms are parallel to the ground, targeting chest, triceps, and shoulders.'],
    ['dead lift', 'A compound movement where you lift a barbell from the ground to a standing position, engaging muscles in the back, glutes, hamstrings, and core.'],
    ['squat', 'A compound lower body exercise where you lower your hips towards the ground, keeping your back straight, and then stand back up, primarily targeting quadriceps, hamstrings, glutes, and core.'],
];

// Empty database before starting tests
const truncateWorkoutsExercisesAndRelatedTables = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/exercises/truncate');
}

// Fill database with some exercises to be able to add them to workouts
const initExercisesTableInDb = async () => {
    for (const exercise of exercises) {
        const req = {
            alias: exercise[0],
            description: exercise[1],
        };
        await request.post('/exercises').send(req);
    }
}

const addWorkoutsAndExercises = async (exercisesIds) => {
    // Create some workouts with their exercises
    const pushResponse = await request.post(BASE_ENDPOINT).send({
        alias: "Push",
        description: "Test push exercise",
    });

    const pullResponse = await request.post(BASE_ENDPOINT).send({
        alias: "Pull",
        description: "Test pull exercise",
    });

    const legResponse = await request.post(BASE_ENDPOINT).send({
        alias: "Leg",
        description: "Test leg exercise",
    });

    // Add exercises to workouts
    // PUSH: bench press
    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 1,
        reps: 5,
        weight: 55,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 2,
        reps: 5,
        weight: 55,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 3,
        reps: 4,
        weight: 55,
        time_in_seconds: 0,
    });


    // PUSH: dip
    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 1,
        reps: 8,
        weight: 10,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 10,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 3,
        reps: 7,
        weight: 10,
        time_in_seconds: 0,
    });

    // PULL: barbell row
    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 1,
        reps: 9,
        weight: 75,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 75,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 3,
        reps: 8,
        weight: 75,
        time_in_seconds: 0,
    });

    // PULL: pull up
    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 1,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 2,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 3,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });


    // LEG: dead lift
    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 1,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 3,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });


    // LEG: squat
    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 1,
        reps: 5,
        weight: 85,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 2,
        reps: 5,
        weight: 85,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 3,
        reps: 4,
        weight: 85,
        time_in_seconds: 0,
    });

    return {
        pushResponse,
        pullResponse,
        legResponse,
    };
};


const getExercisesIds = async () => {
    const exercisesIds = {};

    // If solving all promises with Promise.all tests fail
    for (const exercise of exercises) {
        const name = exercise[0];

        let id;

        try {
            id = await dbExercises.selectIdForExerciseName(name, true); 
        } catch (error) {
            throw error;
        }

        exercisesIds[name] = id;
    }

    return exercisesIds;
}

const successfulPostRequest = {
    alias: "first_test_workout",
    description: "This is the description for a test workout",
}

describe(`${BASE_ENDPOINT}`,  () => {
    beforeAll(async () => {
        await truncateWorkoutsExercisesAndRelatedTables();
    });

    describe('post requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            it("returns workout object", () => {
                const expectedKeys = ['id', 'alias', 'description', 'exercises'];

                const allKeysIncluded = utils.checkKeysInObject(expectedKeys,
                    response.body)
                expect(allKeysIncluded).toBe(true);
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
            await truncateWorkoutsExercisesAndRelatedTables();
            await initExercisesTableInDb();

            try {
                exercisesIds = await getExercisesIds();
            } catch (error) {
                console.log("EEERROOOOOOOR")
                console.log(error);
            }

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
                const expectedKeys = ['id', 'alias', 'description', 'exercises'];
                const workoutObject = response.body[0];

                expect(utils.checkKeysInObject(expectedKeys, workoutObject)).toBe(true);
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
        await truncateWorkoutsExercisesAndRelatedTables();
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
            await truncateWorkoutsExercisesAndRelatedTables();
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
                const expectedKeys = ['id', 'alias', 'description', 'exercises'];
                const workoutObject = response.body;

                expect(utils.checkKeysInObject(expectedKeys, workoutObject)).toBe(true);
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
            await truncateWorkoutsExercisesAndRelatedTables();
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
            await truncateWorkoutsExercisesAndRelatedTables();
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
        await truncateWorkoutsExercisesAndRelatedTables();
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
                await truncateWorkoutsExercisesAndRelatedTables();
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
            await truncateWorkoutsExercisesAndRelatedTables();
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