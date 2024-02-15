// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../app.js');

const app = createApp();
const BASE_ENDPOINT = '/users'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

// TODO Could be usefull to use a test database for a real project

describe(`${BASE_ENDPOINT}`, () => {
    describe('post requests', () => {
        describe("happy path", () => {
            it("response 200 returns list", async () => {
                const response = await request.get(BASE_ENDPOINT);

                console.log('Response');
                console.log(response.statusCode);
                expect(response.statusCode).toBe(200);
            });

        });

        // describe('unhappy paths', () => {
            // it('unhappy path example', () => {});
        // });
    });
});