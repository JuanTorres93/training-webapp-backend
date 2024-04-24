
// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

// true means that it should connect to test db
const app = createApp(true);
const BASE_ENDPOINT = '/exercises'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

// Empty database before starting tests
const truncateExercisesAndRelatedTables = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
}

const successfulPostRequest = {
    alias: "first_test_exercise",
    description: "This is the description for a test exercise",
}

describe(`${BASE_ENDPOINT}`,  () => {
    beforeAll(async () => {
        await truncateExercisesAndRelatedTables();
    });

    describe('post requests', () => {
        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            it("returns exercise object", () => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('alias');
                expect(response.body).toHaveProperty('description');
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
        beforeAll(async () => {
            await truncateExercisesAndRelatedTables();
            const newExerciseResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
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


describe(`${BASE_ENDPOINT}` + '/{exerciseId}',  () => {
    let response;
    let id;

    beforeAll(async () => {
        // Test's set up
        await truncateExercisesAndRelatedTables();
        const newExerciseResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
        const newExercise = newExerciseResponse.body;

        // get id of the exercise in db, since it changes every time the suite is run
        id = newExercise.id;

        // Test response
        response = await request.get(BASE_ENDPOINT + `/${id}`);
    });

    describe('get requests', () => {
        describe('happy path', () => {
            it("status code of 200", () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('exercise object has id, alias, and description properties', () => {
                const exerciseObject = response.body;

                expect(exerciseObject).toHaveProperty('id');
                expect(exerciseObject).toHaveProperty('alias');
                expect(exerciseObject).toHaveProperty('description');
            });
        });

        describe('uphappy paths', () => {
            describe('400 response when', () => {
                it('exerciseId is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseId is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseId is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('exerciseId is valid but exercise with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put request', () => {
        const putBodyRequest = {
            alias: "updated alias",
            description: "updated description",
        };

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                await truncateExercisesAndRelatedTables();
                const newExerciseResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
                const newExercise = newExerciseResponse.body;

                // get id of the exercise in db, since it changes every time the suite is run
                id = newExercise.id;

                // Test response
                response = await request.put(BASE_ENDPOINT + `/${id}`).send(putBodyRequest);
            });

            it('returns updated exercise', () => {
                const updatedExercise = response.body;

                expect(updatedExercise.id).toStrictEqual(id);
                expect(updatedExercise.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedExercise.description).toStrictEqual(putBodyRequest.description);

            });

            it('returns 200 status code', () => {
                expect(response.statusCode).toStrictEqual(200);

            });
        });

        describe('unhappy path', () => {
            describe('returns 400 error code when', () => {
                it('exerciseid is string', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/wrongId').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/true').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/-23').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('exerciseid is valid but exercise with that id does not exist', async () => {
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
        describe('unhappy path', () => {
            describe('returns 400 error code when', () => {
                it('exerciseid is string', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is boolean', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('exerciseid is not positive', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/-23');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('exerciseid is valid but exercise with that id does not exist', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
            
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // Test's set up
                await truncateExercisesAndRelatedTables();
                const newExerciseResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
                const newExercise = newExerciseResponse.body;

                // get id of the exercise in db, since it changes every time the suite is run
                id = newExercise.id;

                // Test response
                response = await request.delete(BASE_ENDPOINT + `/${id}`)
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted exercise', () => {
                const deletedexercise = response.body;

                expect(deletedexercise.id).toStrictEqual(id);
                expect(deletedexercise.alias).toStrictEqual(successfulPostRequest.alias);
                expect(deletedexercise.description).toStrictEqual(successfulPostRequest.description);
            });
            
        });
    });
});