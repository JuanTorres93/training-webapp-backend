// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

// true means that it should connect to test db
const app = createApp(true);
const BASE_ENDPOINT = '/exercises';

function logErrors(err, req, res, next) {
  console.error(err.stack)
  next(err)
};

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const newUserReq = {
  alias: "first_test_user",
  email: "first_user@domain.com",
  last_name: "Manacle",
  password: "$ecur3_P@ssword",
  second_last_name: "Sanches",
  registeredViaOAuth: false,
};

module.exports = {
  request,
  BASE_ENDPOINT,
  newUserReq,
};