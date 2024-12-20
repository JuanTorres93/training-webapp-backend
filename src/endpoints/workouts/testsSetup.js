// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../../app.js');

const app = createApp();
const BASE_ENDPOINT = '/workouts';
const { OTHER_USER_ALIAS } = require('../exercises/testsSetup.js');
const dbExercises = require('../../db/exercises.js');
const { newUserRequestNoOauth, newWorkoutRequest } = require('../testCommon.js');

function logErrors(err, req, res, next) {
    console.error(err.stack)
    next(err)
};

app.use(logErrors);

// I use agent for storing user info when login in
const request = supertest.agent(app);

// TODO delete after refactor=?
const successfulPostRequest = {
    ...newWorkoutRequest
}

const newUserReq = {
    ...newUserRequestNoOauth,
};

const createWorkoutRequest = {
    name: "workout_with_exercises",
    description: "This is the description for a workout with exercises",
};

const exercises = [
    ['bench press', 'A compound upper body exercise where you lie on a bench and press a barbell upwards, targeting chest, shoulders, and triceps.'],
    ['barbell row', 'An upper body exercise where you bend forward at the hips, pulling a barbell towards your torso, targeting back muscles like lats and rhomboids.'],
    ['pull up', 'A bodyweight exercise where you hang from a bar and pull yourself up until your chin is above the bar, primarily targeting the back, arms, and shoulders.'],
    ['dip', 'A bodyweight exercise where you suspend yourself between parallel bars and lower your body until your upper arms are parallel to the ground, targeting chest, triceps, and shoulders.'],
    ['dead lift', 'A compound movement where you lift a barbell from the ground to a standing position, engaging muscles in the back, glutes, hamstrings, and core.'],
    ['squat', 'A compound lower body exercise where you lower your hips towards the ground, keeping your back straight, and then stand back up, primarily targeting quadriceps, hamstrings, glutes, and core.'],
];

// Fill database with some exercises to be able to add them to workouts
const initExercisesTableInDb = async () => {
    // login user
    await request.post('/login').send({
        username: newUserReq.username,
        password: newUserReq.password,
    });

    // Create exercises
    for (const exercise of exercises) {
        const req = {
            name: exercise[0],
            description: exercise[1],
        };
        await request.post('/exercises').send(req);
    }

    // logout user
    await request.get('/logout');
}

const addWorkoutsAndExercises = async (userId, exercisesIds) => {
    // login user
    await request.post('/login').send({
        username: newUserReq.username,
        password: newUserReq.password,
    });

    // Create templates for the workouts
    const pushTemplateRequest = {
        userId,
        name: "Push",
        description: "Push workout",
    };
    const pushTemplateResponse = await request.post('/workouts/templates').send(pushTemplateRequest);
    const pushTemplate = pushTemplateResponse.body;
    const pushTemplateId = pushTemplateResponse.body.id;

    const pullTemplateRequest = {
        userId,
        name: "Pull",
        description: "Pull workout",
    };
    const pullTemplateResponse = await request.post('/workouts/templates').send(pullTemplateRequest);
    const pullTemplateId = pullTemplateResponse.body.id;

    const legTemplateRequest = {
        userId,
        name: "Leg",
        description: "Leg workout",
    };
    const legTemplateResponse = await request.post('/workouts/templates').send(legTemplateRequest);
    const legTemplateId = legTemplateResponse.body.id;

    // Create some workouts with their exercises
    const pushResponse = await request.post(BASE_ENDPOINT).send({
        template_id: pushTemplateId,
        description: "Test push workout",
    });

    const pullResponse = await request.post(BASE_ENDPOINT).send({
        template_id: pullTemplateId,
        description: "Test pull workout",
    });

    const legResponse = await request.post(BASE_ENDPOINT).send({
        template_id: legTemplateId,
        description: "Test leg workout",
    });

    // Add exercises to workouts
    // PUSH: bench press
    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 1,
        reps: 5,
        weight: 55,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 2,
        reps: 5,
        weight: 55,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[0][0]],
        exerciseSet: 3,
        reps: 4,
        weight: 55,
        time_in_seconds: 0,
    });


    // PUSH: dip
    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 1,
        reps: 8,
        weight: 10,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 10,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pushResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[3][0]],
        exerciseSet: 3,
        reps: 7,
        weight: 10,
        time_in_seconds: 0,
    });

    // PULL: barbell row
    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 1,
        reps: 9,
        weight: 75,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 75,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[1][0]],
        exerciseSet: 3,
        reps: 8,
        weight: 75,
        time_in_seconds: 0,
    });

    // PULL: pull up
    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 1,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 2,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${pullResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[2][0]],
        exerciseSet: 3,
        reps: 6,
        weight: 12.5,
        time_in_seconds: 0,
    });


    // LEG: dead lift
    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 1,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 2,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[4][0]],
        exerciseSet: 3,
        reps: 8,
        weight: 80,
        time_in_seconds: 0,
    });


    // LEG: squat
    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 1,
        reps: 5,
        weight: 85,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 2,
        reps: 5,
        weight: 85,
        time_in_seconds: 0,
    });

    await request.post(BASE_ENDPOINT + `/${legResponse.body.id}`).send({
        exerciseId: exercisesIds[exercises[5][0]],
        exerciseSet: 3,
        reps: 4,
        weight: 85,
        time_in_seconds: 0,
    });

    // logout user
    await request.get('/logout');

    return {
        pushResponse,
        pushTemplate,
        pullResponse,
        legResponse,
    };
};

const getExercisesIds = async () => {
    const exercisesIds = {};

    // If solving all promises with Promise.all tests fail
    for (const exercise of exercises) {
        const name = exercise[0];

        let id;

        try {
            id = await dbExercises.selectIdForExerciseName(name, true);
        } catch (error) {
            throw error;
        }

        exercisesIds[name] = id;
    }

    return exercisesIds;
}

const setUp = async () => {
    await request.get(BASE_ENDPOINT + '/truncate');
    await request.get('/exercises/truncate');
    await request.get('/users/truncate');
    await request.get('/workouts/templates/truncate');

    // Add user to db
    const userReponse = await request.post('/users').send(newUserReq);
    const user = userReponse.body;

    // Add other user to db
    const otherUserResponse = await request.post('/users').send({
        ...newUserReq,
        username: OTHER_USER_ALIAS,
        email: 'other@user.com',
    });
    const otherUser = otherUserResponse.body;


    // login user
    await request.post('/login').send({
        username: newUserReq.username,
        password: newUserReq.password,
    });

    // logout user
    await request.get('/logout');

    return { user, otherUser };
}

module.exports = {
    BASE_ENDPOINT,
    OTHER_USER_ALIAS,
    exercises,
    newUserReq,
    successfulPostRequest,
    createWorkoutRequest,
    request,
    initExercisesTableInDb,
    addWorkoutsAndExercises,
    getExercisesIds,
    setUp,
};
