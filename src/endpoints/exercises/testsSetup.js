// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

const app = createApp();
const BASE_ENDPOINT = '/exercises';
OTHER_USER_ALIAS = 'other user';

const successfulPostRequest = {
  alias: "first_test_exercise",
  description: "This is the description for a test exercise",
}

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


const setUp = async () => {
  await request.get(BASE_ENDPOINT + '/truncate');
  await request.get('/users/truncate');

  // Add user to db
  const newUserResponse = await request.post('/users').send(newUserReq);
  const newUser = newUserResponse.body;

  // Add other user to db
  const otherUserResponse = await request.post('/users').send({
    ...newUserReq,
    alias: OTHER_USER_ALIAS,
    email: 'other@user.com',
  });
  const otherUser = otherUserResponse.body;

  // login user
  await request.post('/login').send({
    username: newUserReq.alias,
    password: newUserReq.password,
  });

  // Add exercise to db
  const newExercisesResponse = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
  const newExercise = newExercisesResponse.body;

  // logout user
  await request.get('/logout');

  return {
    newUser,
    newExercise,
    otherUser,
  };
};

module.exports = {
  OTHER_USER_ALIAS,
  request,
  BASE_ENDPOINT,
  newUserReq,
  successfulPostRequest,
  setUp,
};