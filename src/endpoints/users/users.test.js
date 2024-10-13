const {
    request,
    BASE_ENDPOINT,
    successfulPostRequest,
    setUp,
} = require('./testsSetup');
const hash = require('../../hashing.js');

const selectEverythingFromUserId = async (id) => {
    const response = await request.get(BASE_ENDPOINT + `/${id}/allTest`)
    return response.body;
};

describe(`${BASE_ENDPOINT}`, () => {
    describe('post requests', () => {
        let response;

        beforeAll(async () => {
            await setUp();
            response = await request.post(BASE_ENDPOINT).send({
                ...successfulPostRequest,
                alias: "second test user",
                email: "second_user@domain.com",
            });
        });

        describe("register user successfully", () => {
            it("returns user object", () => {
                const user = response.body;
                expect(user).toHaveProperty('id');
                expect(user).toHaveProperty('alias');
                expect(user).toHaveProperty('email');
                expect(user).toHaveProperty('last_name');
                expect(user).toHaveProperty('second_last_name');
                expect(user).toHaveProperty('img');
                // Do NOT return user password
                expect(user).not.toHaveProperty('password');
            });

            it("status code of 201", () => {
                expect(response.statusCode).toStrictEqual(201);
            });

            it('does not store password as is submitted', async () => {
                const userInDb = await selectEverythingFromUserId(response.body.id);

                expect(userInDb.password.trim()).not.toEqual(successfulPostRequest.password.trim());
            });

            it('hashes password', async () => {
                const userInDb = await selectEverythingFromUserId(response.body.id);

                const passwordsMatch = await hash.comparePlainTextToHash(successfulPostRequest.password,
                    userInDb.password);
                expect(passwordsMatch).toBe(true);
            });
        });

        describe('unhappy paths', () => {
            it('400 response when mandatory parameter is missing', async () => {
                // alias is missing
                let response = await request.post(BASE_ENDPOINT).send({
                    email: "John.Doe@domain.com",
                    last_name: "Doe",
                    password: "$ecur3_P@ssword",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);

                // email is missing
                response = await request.post(BASE_ENDPOINT).send({
                    alias: "John",
                    last_name: "Doe",
                    password: "$ecur3_P@ssword",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);

                // password is missing
                response = await request.post(BASE_ENDPOINT).send({
                    alias: "John",
                    email: "John.Doe@domain.com",
                    last_name: "Doe",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);
            });

            it('409 response when email already exists in db', async () => {
                const req = {
                    ...successfulPostRequest,
                    // email same as successfulRequest
                    alias: "another_alias",
                    last_name: "another_last_name",
                    password: "@n0th3r_Pa$swOrd",
                    second_last_name: "another second last name",
                };

                let response = await request.post(BASE_ENDPOINT).send(req);
                response = await request.post(BASE_ENDPOINT).send(req);
                expect(response.statusCode).toStrictEqual(409);
            });

            it('409 response when alias already exists in db', async () => {
                let req = {
                    ...successfulPostRequest,
                    // alias same as successfulRequest
                    email: "another_mail@domain.com",
                    last_name: "another_last_name",
                    password: "@n0th3r_PasswOrd",
                    second_last_name: "another second last name",
                };
                let response = await request.post(BASE_ENDPOINT).send(req);
                response = await request.post(BASE_ENDPOINT).send(req);
                expect(response.statusCode).toStrictEqual(409);
            });
        });
    });

    describe('get requests', () => {
        // ============
        // GET requests
        // ============
        let response;

        beforeEach(async () => {
            await setUp();
            response = await request.get(BASE_ENDPOINT);
        });

        describe("get all users", () => {
            it("returns list", async () => {
                expect(Array.isArray(response.body)).toBe(true);
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('user object has id, alias, email, last_name, img and second_last_name properties', () => {
                const userObject = response.body[0];

                expect(userObject).toHaveProperty('id');
                expect(userObject).toHaveProperty('alias');
                expect(userObject).toHaveProperty('email');
                expect(userObject).toHaveProperty('last_name');
                expect(userObject).toHaveProperty('img');
                expect(userObject).toHaveProperty('second_last_name');
                expect(userObject).not.toHaveProperty('password');
            });
        });

        // describe('unhappy paths', () => {
        // TODO test for 403 response
        // it('unhappy path example', () => {});
        // });
    });
});
