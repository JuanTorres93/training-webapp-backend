// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

const app = createApp();
const BASE_ENDPOINT = '/weights';

const { newUserRequestNoOauth } = require('../testCommon.js');

function logErrors(err, req, res, next) {
  console.error(err.stack)
  next(err)
};

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const successfulPostRequest = {
  date: '2021-01-01',
  value: 100,
}

const otherUserName = 'other';

const setUp = async () => {
  // Empty database before starting tests
  await request.get(BASE_ENDPOINT + '/truncate');
  await request.get('/users/truncate');

  // Add user to db
  const newUserResponse = await request.post('/users').send(newUserRequestNoOauth);
  const newUser = newUserResponse.body;

  // Add another user to db
  const otherUserResponse = await request.post('/users').send({
    ...newUserRequestNoOauth,
    username: otherUserName,
    email: 'other@domain.com',
  });
  const otherUser = otherUserResponse.body;

  return {
    newUser,
    otherUser,
  };
}

module.exports = {
  request,
  BASE_ENDPOINT,
  successfulPostRequest,
  newUserRequestNoOauth,
  otherUserName,
  setUp,
};