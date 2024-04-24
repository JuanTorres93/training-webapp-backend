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
