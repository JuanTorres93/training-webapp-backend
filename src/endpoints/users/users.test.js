const { request, BASE_ENDPOINT } = require('./testsSetup');
const hash = require('../../hashing.js');

// Empty database before starting tests
const truncateUsersAndRelatedTables = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
}

const selectEverythingFromUserId = async (id) => {
    const response = await request.get(BASE_ENDPOINT + `/${id}/allTest`)
    return response.body;
};

const successfulPostRequest = {
    alias: "first_test_user",
    email: "first_user@domain.com",
    last_name: "Manacle",
    password: "$ecur3_P@ssword",
    second_last_name: "Sanches",
}

describe(`${BASE_ENDPOINT}`,  () => {
    let postResponse;

    beforeAll(async () => {
        await truncateUsersAndRelatedTables();
        postResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
    });

    describe('post requests', () => {
        describe("register user successfully", () => {
            it("returns user object", () => {
                const user = postResponse.body;
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
                expect(postResponse.statusCode).toStrictEqual(201);
            });

            it('does not store password as is submitted', async () => {
                const userInDb = await selectEverythingFromUserId(postResponse.body.id);

                expect(userInDb.password.trim()).not.toEqual(successfulPostRequest.password.trim());
            });

            it('hashes password', async () => {
                const userInDb = await selectEverythingFromUserId(postResponse.body.id);

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
            await truncateUsersAndRelatedTables();
            const postResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);

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

describe(`${BASE_ENDPOINT}/{id}`,  () => {
    let response;
    let id;

    beforeAll(async () => {
        // Test's set up
        await truncateUsersAndRelatedTables();
        const userResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
        const user = userResponse.body;

        // get id of the user in db, since it changes every time the suite is run
        id = user.id;

        // Test response
        response = await request.get(BASE_ENDPOINT + `/${id}`);
    });

    describe('get requests', () => {
        describe('happy path', () => {
            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('user object has id, alias, email, last_name, img and second_last_name properties', () => {
                const userObject = response.body;

                expect(userObject).toHaveProperty('id');
                expect(userObject).toHaveProperty('alias');
                expect(userObject).toHaveProperty('email');
                expect(userObject).toHaveProperty('last_name');
                expect(userObject).toHaveProperty('second_last_name');
                expect(userObject).toHaveProperty('img');

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
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
        });
    });

    describe('put requests', () => {
        const putBodyRequest = {
            alias: "updated alias with put",
            email: "updated_email_with_put@domain.com",
            last_name: "updated_last_name_with_put",
            password: "Upd@t3d_Pasword_with_put",
            second_last_name: "updated_second_last_with_put",
            img: "img",
        };

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                response = await request.put(BASE_ENDPOINT + `/${id}`).send(putBodyRequest);
            });

            it('returns updated user', () => {
                const updatedUser = response.body;

                expect(updatedUser.id).toStrictEqual(id);
                expect(updatedUser.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedUser.email).toStrictEqual(putBodyRequest.email);
                expect(updatedUser.last_name).toStrictEqual(putBodyRequest.last_name);
                expect(updatedUser.second_last_name).toStrictEqual(putBodyRequest.second_last_name);
                expect(updatedUser.img).toStrictEqual(putBodyRequest.img);

                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
            });

            it('changes are reflected in db', async () => {
                const updatedUserFromDb = await selectEverythingFromUserId(id);

                expect(updatedUserFromDb.id).toStrictEqual(id);
                expect(updatedUserFromDb.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedUserFromDb.email).toStrictEqual(putBodyRequest.email);
                expect(updatedUserFromDb.last_name).toStrictEqual(putBodyRequest.last_name);
                expect(updatedUserFromDb.second_last_name).toStrictEqual(putBodyRequest.second_last_name);
                expect(updatedUserFromDb.img).toStrictEqual(putBodyRequest.img);
            });

            it('does not store password as is submitted', async () => {
                const userInDb = await selectEverythingFromUserId(id);

                expect(userInDb.password.trim()).not.toEqual(putBodyRequest.password.trim());
            });

            it('hashes password', async () => {
                const userInDb = await selectEverythingFromUserId(id);

                const passwordsMatch = await hash.comparePlainTextToHash(putBodyRequest.password,
                                                                         userInDb.password);
                expect(passwordsMatch).toBe(true);
            });

            it('does not crash for every possible field update', async () => {
                const putReq = {
                    alias: "new alias",
                    email: "new-email@domain.com",
                    last_name: "new last name",
                    password: "N3w p@ssWord",
                    second_last_name: "new second last name",
                    img: "new img",
                };

                Object.keys(putReq).forEach(async (field) => {
                    const individualReq = {
                        [field]: putReq[field],
                    };

                    const res = await request.put(BASE_ENDPOINT + `/${id}`).send(individualReq);

                    if (field !== 'password') {
                        expect(res.body[field]).toStrictEqual(individualReq[field]);
                    } else {
                        const userInDb = await selectEverythingFromUserId(id);

                        const passwordsMatch = await hash.comparePlainTextToHash(individualReq.password,
                                                                                 userInDb.password);
                        expect(passwordsMatch).toBe(true);
                    }
                });
            });
        });

        describe('unhappy paths', () => {
            describe('returns 400 error code when', () => {
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

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    // alias and email need to be modified again to avoid 409 conflict
                    // response due to violating unique constraints.
                    const response = await request.put(BASE_ENDPOINT + '/1').send({
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
            describe('returns 400 error code when', () => {
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

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    // alias and email need to be modified again to avoid 409 conflict
                    // response due to violating unique constraints.
                    const response = await request.delete(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });
            });
            
        });

        describe('happy path', () => {
            let response;

            beforeAll(async () => {
                // return db registry to its original state
                await request.put(BASE_ENDPOINT + `/${id}`).send({
                    ...successfulPostRequest,
                    img: null,
                });
                response = await request.delete(BASE_ENDPOINT + `/${id}`)
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('returns deleted user', () => {
                const deletedUser = response.body;

                expect(deletedUser.id).toStrictEqual(id);
                expect(deletedUser.alias).toStrictEqual(successfulPostRequest.alias);
                expect(deletedUser.email).toStrictEqual(successfulPostRequest.email);
                expect(deletedUser.last_name).toStrictEqual(successfulPostRequest.last_name);
                expect(deletedUser.second_last_name).toStrictEqual(successfulPostRequest.second_last_name);

                expect(response.body).toHaveProperty('img');

                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
            });
            
        });
    });
});
