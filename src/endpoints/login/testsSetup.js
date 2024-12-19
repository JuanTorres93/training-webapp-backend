// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

const app = createApp();
const BASE_ENDPOINT = '/login';

const { newUserRequestNoOauth } = require('../testCommon.js');

USER_ALIAS = newUserRequestNoOauth.username;
USER_PASSWORD = newUserRequestNoOauth.password;

function logErrors(err, req, res, next) {
  console.error(err.stack)
  next(err)
};

app.use(logErrors);

const setUp = async () => {
  await request.get('/users/truncate');
  await request.get('/exercises/truncate');
  await request.get('/workouts/truncate');
  await request.get('/workouts/templates/truncate');

  const newUserResponse = await request.post('/users').send({
    ...newUserRequestNoOauth,
  });
  const newUser = newUserResponse.body;

  return {
    newUser,
  };
};

// I use agent for storing user info when login in
const request = supertest.agent(app);

module.exports = {
  BASE_ENDPOINT,
  USER_ALIAS,
  USER_PASSWORD,
  request,
  setUp,
};