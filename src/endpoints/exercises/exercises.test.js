const { request, BASE_ENDPOINT } = require('./testsSetup');

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');

    // Add exercise to db
    const newExercisesResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
    const newExercise = newExercisesResponse.body;

    return {
        newExercise
    };
};

const successfulPostRequest = {
    alias: "first_test_exercise",
    description: "This is the description for a test exercise",
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
