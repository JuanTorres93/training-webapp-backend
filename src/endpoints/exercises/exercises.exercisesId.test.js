const { request, BASE_ENDPOINT } = require('./testsSetup');

const successfulPostRequest = {
    alias: "first_test_exercise",
    description: "This is the description for a test exercise",
}

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');

    // Add exercise to db
    const newExercisesResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
    const newExercise = newExercisesResponse.body;

    return {
        newExercise,
    };
};

describe(`${BASE_ENDPOINT}` + '/{exerciseId}',  () => {
    let newExercise;

    describe('get requests', () => {
        let response;

        beforeAll(async () => {
            // Test's set up
            const setUpInfo = await setUp();
            newExercise = setUpInfo.newExercise;

            // Test response
            response = await request.get(BASE_ENDPOINT + `/${newExercise.id}`);
        });

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
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Test response
                response = await request.put(BASE_ENDPOINT + `/${newExercise.id}`).send(putBodyRequest);
            });

            it('returns updated exercise', () => {
                const updatedExercise = response.body;

                expect(updatedExercise.id).toStrictEqual(newExercise.id);
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
                const setUpInfo = await setUp();
                newExercise = setUpInfo.newExercise;

                // Test response
                response = await request.delete(BASE_ENDPOINT + `/${newExercise.id}`)
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted exercise', () => {
                const deletedexercise = response.body;

                expect(deletedexercise.id).toStrictEqual(newExercise.id);
                expect(deletedexercise.alias).toStrictEqual(successfulPostRequest.alias);
                expect(deletedexercise.description).toStrictEqual(successfulPostRequest.description);
            });
            
        });
    });
});