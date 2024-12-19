const {
    request,
    BASE_ENDPOINT,
    successfulPostRequest,
    setUp,
} = require('./testsSetup.js');
const hash = require('../../hashing.js');

const selectEverythingFromUserId = async (id) => {
    const response = await request.get(BASE_ENDPOINT + `/${id}/allTest`)
    return response.body;
};

describe(`${BASE_ENDPOINT}/{id}`, () => {
    let response;
    let newUser;

    beforeAll(async () => {
        // Test's set up
        const setUpInfo = await setUp();
        newUser = setUpInfo.newUser;

        // login user
        await request.post('/login').send({
            username: successfulPostRequest.username,
            password: successfulPostRequest.password,
        });

        // Test response
        response = await request.get(BASE_ENDPOINT + `/${newUser.id}`);

        // logout user
        await request.get('/logout');
    });

    describe('get requests', () => {
        describe('happy path', () => {
            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('user object has correct properties', () => {
                const userObject = response.body;

                expect(userObject).toHaveProperty('id');
                expect(userObject).toHaveProperty('username');
                expect(userObject).toHaveProperty('email');
                expect(userObject).toHaveProperty('subscription_id');
                expect(userObject).toHaveProperty('last_name');
                expect(userObject).toHaveProperty('img');
                expect(userObject).toHaveProperty('second_last_name');
                expect(userObject).toHaveProperty('is_premium');
                expect(userObject).toHaveProperty('is_early_adopter');
                expect(userObject).toHaveProperty('created_at');
                // Do NOT return user password
                expect(userObject).not.toHaveProperty('password');
            });
        });

        describe('uphappy paths', () => {
            describe('400 response when', () => {
                it('userid is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    // generate a valid UUID that probably won't be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.get(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put requests', () => {
        const putBodyRequest = {
            username: "updated alias with put",
            email: "updated_email_with_put@domain.com",
            last_name: "updated_last_name_with_put",
            password: "Upd@t3d_Pasword_with_put",
            second_last_name: "updated_second_last_with_put",
            img: "img",
        };

        describe('happy path', () => {
            let response;
            let newUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;

                // login user
                await request.post('/login').send({
                    username: successfulPostRequest.username,
                    password: successfulPostRequest.password,
                });

                response = await request.put(BASE_ENDPOINT + `/${newUser.id}`).send(putBodyRequest);
            });

            afterAll(async () => {
                // logout user
                await request.get('/logout');
            });

            it('returns updated user', () => {
                const updatedUser = response.body;

                expect(updatedUser.id).toStrictEqual(newUser.id);
                expect(updatedUser.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedUser.email).toStrictEqual(putBodyRequest.email);
                expect(updatedUser.last_name).toStrictEqual(putBodyRequest.last_name);
                expect(updatedUser.second_last_name).toStrictEqual(putBodyRequest.second_last_name);
                expect(updatedUser.img).toStrictEqual(putBodyRequest.img);

                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
            });

            it('changes are reflected in db', async () => {
                const updatedUserFromDb = await selectEverythingFromUserId(newUser.id);

                expect(updatedUserFromDb.id).toStrictEqual(newUser.id);
                expect(updatedUserFromDb.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedUserFromDb.email).toStrictEqual(putBodyRequest.email);
                expect(updatedUserFromDb.last_name).toStrictEqual(putBodyRequest.last_name);
                expect(updatedUserFromDb.second_last_name).toStrictEqual(putBodyRequest.second_last_name);
                expect(updatedUserFromDb.img).toStrictEqual(putBodyRequest.img);
            });

            it('does not store password as is submitted', async () => {
                const userInDb = await selectEverythingFromUserId(newUser.id);

                expect(userInDb.password.trim()).not.toEqual(putBodyRequest.password.trim());
            });

            it('hashes password', async () => {
                const userInDb = await selectEverythingFromUserId(newUser.id);

                const passwordsMatch = await hash.comparePlainTextToHash(putBodyRequest.password,
                    userInDb.password);
                expect(passwordsMatch).toBe(true);
            });
        });

        describe('unhappy paths', () => {
            let newUser;
            let otherUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;
                otherUser = setUpInfo.otherUser;

                // Ensure user is logged out
                await request.get('/logout');
            });

            describe('400 response when', () => {
                it('userid is string', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/wrongId').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is boolean', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/true').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is not positive', async () => {
                    const response = await request.put(BASE_ENDPOINT + '/-23').send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 response when', () => {
                it('user is not logged in', async () => {
                    const response = await request.put(BASE_ENDPOINT + `/${newUser.id}`).send(putBodyRequest);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to modify another user data', async () => {
                    // login user
                    await request.post('/login').send({
                        username: successfulPostRequest.username,
                        password: successfulPostRequest.password,
                    });

                    const response = await request.put(BASE_ENDPOINT + `/${otherUser.id}`).send(putBodyRequest);

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    // alias and email need to be modified again to avoid 409 conflict
                    // response due to violating unique constraints.

                    // generate a valid UUID that probably won't be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.put(BASE_ENDPOINT + '/' + uuid).send({
                        ...putBodyRequest,
                        alias: 'updated alias with put modified',
                        email: 'updated_email_with_put_modified@domain.com',
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
            let newUser;
            let otherUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;
                otherUser = setUpInfo.otherUser;

                // Ensure user is logged out
                await request.get('/logout');
            });

            describe('400 error code when', () => {
                it('userid is string', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is boolean', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is not positive', async () => {
                    const response = await request.delete(BASE_ENDPOINT + '/-23');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('401 error code when', () => {
                it('user is not logged in', async () => {
                    const response = await request.delete(BASE_ENDPOINT + `/${newUser.id}`);
                    expect(response.statusCode).toStrictEqual(401);
                });
            });

            describe('403 response when', () => {
                it('trying to delete another user', async () => {
                    // login user
                    await request.post('/login').send({
                        username: successfulPostRequest.username,
                        password: successfulPostRequest.password,
                    });

                    const response = await request.delete(BASE_ENDPOINT + `/${otherUser.id}`)

                    // logout user
                    await request.get('/logout');
                    expect(response.statusCode).toStrictEqual(403);
                });
            });

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    // alias and email need to be modified again to avoid 409 conflict
                    // response due to violating unique constraints.

                    // generate a valid UUID that probably won't be in the db
                    const uuid = '00000000-0000-0000-0000-000000000000';
                    const response = await request.delete(BASE_ENDPOINT + '/' + uuid);
                    expect(response.statusCode).toStrictEqual(404);
                });
            });

        });

        describe('happy path', () => {
            let response;
            let newUser;

            beforeAll(async () => {
                // Test's set up
                const setUpInfo = await setUp();
                newUser = setUpInfo.newUser;

                // login user
                await request.post('/login').send({
                    username: successfulPostRequest.username,
                    password: successfulPostRequest.password,
                });

                // return db registry to its original state
                await request.put(BASE_ENDPOINT + `/${newUser.id}`).send({
                    ...successfulPostRequest,
                    img: null,
                });
                response = await request.delete(BASE_ENDPOINT + `/${newUser.id}`)
            });

            afterAll(async () => {
                // logout user
                // await request.get('/logout');
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted user', () => {
                const deletedUser = response.body;

                expect(deletedUser.id).toStrictEqual(newUser.id);

                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
            });

        });
    });
});
