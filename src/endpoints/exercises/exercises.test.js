const {
    request,
    BASE_ENDPOINT,
    newUserReq,
    successfulPostRequest,
    setUp,
} = require('./testsSetup');
const { query } = require('../../db/index');

describe(`${BASE_ENDPOINT}`, () => {
    describe('post requests', () => {
        describe('happy path', () => {
            let response;
            let newUser;

            beforeAll(async () => {
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;

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

            it("returns exercise object", () => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('alias');
                expect(response.body).toHaveProperty('description');
            });

            it('id is UUID', () => {
                const id = response.body.id;
                const regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
                expect(id).toMatch(regex);
            })

            it('returns 201 status code', () => {
                expect(response.statusCode).toStrictEqual(201);
            });

            it('also updates users_exercises table', () => {
                const q = "SELECT user_id, exercise_id from users_exercises WHERE exercise_id = $1;"
                const params = [response.body.id];
                query(q, params, (error, results) => {
                    if (error) throw error;
                    info = results.rows[0];

                    expect(info).not.toBeUndefined();
                    expect(info.user_id).toStrictEqual(newUser.id);
                }, true);
            });
        });

        describe('unhappy paths', () => {
            let newUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;

                // Ensure user is logged out
                await request.get('/logout');
            });

            describe('400 error code when', () => {
                it('mandatory parameter is missing', async () => {
                    // alias is missing
                    let response = await request.post(BASE_ENDPOINT).send({
                        description: "Smith",
                    })

                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 error code when', () => {
                it('user is not logged in', async () => {
                    const response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });
        });
    });

    describe('get requests', () => {
        beforeAll(async () => {
            await setUp();
        });

        describe("get all exercises", () => {
            it("returns list", async () => {
                const response = await request.get(BASE_ENDPOINT);
                expect(Array.isArray(response.body)).toBe(true);
            });

            it("status code of 200", async () => {
                const response = await request.get(BASE_ENDPOINT);
                expect(response.statusCode).toStrictEqual(200);
            });

            it('exercise object has id, alias, and description properties', async () => {
                const response = await request.get(BASE_ENDPOINT);

                const exerciseObject = response.body[0];

                expect(exerciseObject).toHaveProperty('id');
                expect(exerciseObject).toHaveProperty('alias');
                expect(exerciseObject).toHaveProperty('description');
            });
        });
    });
});
