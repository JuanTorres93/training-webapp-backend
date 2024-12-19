// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');
const createCommonUser = require('../../createCommonUser.js').createCommonUser;
const { newUserRequestNoOauth } = require('../testCommon.js');

const app = createApp();
const BASE_ENDPOINT = '/workouts/templates';
const OTHER_USER_ALIAS = 'other user';
const TEMPLATE_AND_WORKOUT_NAME = 'test_workout';


function logErrors(err, req, res, next) {
    console.error(err.stack)
    next(err)
};

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

const createNewTemplateRequest = (userId, alias, description) => {
    return {
        userId,
        alias,
        description,
    };
};

const newUserReq = {
    ...newUserRequestNoOauth
};

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/users/truncate');
    await request.get('/exercises/truncate');
    await request.get('/workouts/truncate');

    // Add user to db
    const userResponse = await request.post('/users').send(newUserReq);
    const user = userResponse.body;

    // Add other user to db
    const otherUserResponse = await request.post('/users').send({
        ...newUserReq,
        username: OTHER_USER_ALIAS,
        email: 'other@user.com',
    });
    const otherUser = otherUserResponse.body;

    // DOC first parameter does nothing?
    await createCommonUser('', request);

    // login user
    await request.post('/login').send({
        username: newUserReq.username,
        password: newUserReq.password,
    });

    // Add template to db
    const reqNewTemplate = createNewTemplateRequest(user.id, TEMPLATE_AND_WORKOUT_NAME, 'set up template description')
    const responseNewTemplate = await request.post(BASE_ENDPOINT).send(reqNewTemplate);
    const newTemplate = responseNewTemplate.body;

    // Add exercise to db
    const exerciseResponse = await request.post('/exercises').send({
        alias: "Pull up",
        description: "Fucks your shoulder",
    });
    const newExercise = exerciseResponse.body;

    // Add exercise to template
    const reqAddExerciseToTemplate = {
        exerciseId: newExercise.id,
        exerciseOrder: 1,
        exerciseSets: 3,
    };
    const responseAddExerciseToTemplate = await request.post(
        BASE_ENDPOINT + `/${newTemplate.id}`
    ).send(reqAddExerciseToTemplate);
    const newExerciseInTemplate = responseAddExerciseToTemplate.body;


    // Add workout to db
    const workoutResponse = await request.post('/workouts').send({
        alias: TEMPLATE_AND_WORKOUT_NAME,
        description: "This is the description for a test workout",
    });
    const newWorkout = workoutResponse.body;

    // Add exercise to workout
    const workoutExerciseResponse = await request.post(`/workouts/${newWorkout.id}`).send({
        exerciseId: newExercise.id,
        exerciseSet: 1,
        reps: 3,
        weight: 40,
        time_in_seconds: 70,
    });

    // logout user
    await request.get('/logout');

    return {
        user,
        otherUser,
        newTemplate,
        newExercise,
        newExerciseInTemplate,
        reqNewTemplate,
    };
};

module.exports = {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    TEMPLATE_AND_WORKOUT_NAME,
    request,
    newUserReq,
    createNewTemplateRequest,
    setUp,
};