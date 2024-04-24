// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

// true means that it should connect to test db
const app = createApp(true);
const BASE_ENDPOINT = '/exercises';

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
};

const request = supertest(app.use(logErrors));

module.exports = {
    request,
    BASE_ENDPOINT,
};