const { request, BASE_ENDPOINT, newUserReq,
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
    await request.post('/users').send(newUserReq);

    // Fill database with some exercises to be able to add them to workouts
    // await initExercisesTableInDb();
}

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

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(
                        BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
                    )
                    expect(response.statusCode).toStrictEqual(401);
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
                // login user
                await request.post('/login').send({
                    username: newUserReq.alias,
                    password: newUserReq.password,
                });

                response = await request.delete(
                    BASE_ENDPOINT + `/${workout.id}/exercises/${initialExercise.id}/1`
                )
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
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