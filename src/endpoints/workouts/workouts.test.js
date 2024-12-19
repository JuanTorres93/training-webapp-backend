const {
    request,
    BASE_ENDPOINT,
    newUserReq,
    successfulPostRequest,
    initExercisesTableInDb,
    addWorkoutsAndExercises,
    getExercisesIds,
    setUp,
} = require('./testsSetup');

describe(`${BASE_ENDPOINT}`, () => {
    describe('post requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                await setUp();

                // login user
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });

                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it("returns workout object", () => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('name');
                expect(response.body).toHaveProperty('description');
                expect(response.body).toHaveProperty('exercises');
            });

            it('id is UUID', () => {
                const uuidRegex = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
                expect(response.body.id).toMatch(uuidRegex);
            })

            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        describe('unhappy paths', () => {
            beforeAll(async () => {
                await setUp();

                // Ensure user is logged out
                await request.post('/login').send({
                    username: newUserReq.username,
                    password: newUserReq.password,
                });
                await request.get('/logout');
            });

            it('400 response when mandatory parameter is missing', async () => {
                // name is missing
                let response = await request.post(BASE_ENDPOINT).send({
                    description: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
                    expect(response.statusCode).toStrictEqual(401);
                });
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

            it('workout object has id, name, description and exercises properties', () => {
                const workoutObject = response.body[0];

                expect(workoutObject).toHaveProperty('id');
                expect(workoutObject).toHaveProperty('name');
                expect(workoutObject).toHaveProperty('description');
                expect(workoutObject).toHaveProperty('exercises');
            });
        });
    });
});
