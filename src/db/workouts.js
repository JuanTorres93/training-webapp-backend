const { query } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'workouts';

const createWorkouts = async ({ alias, description }, appIsBeingTested = undefined) => {
    // Build query
    let requiredFields = ['alias'];
    let requiredValues = [alias];

    let optionalFields = ['description'];
    let optionalValues = [description];

    let returningFields = ['id', 'alias', 'description'];

    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME, 
                                                           requiredFields, requiredValues,
                                                           optionalFields, optionalValues,
                                                           returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdWorkout = results.rows[0];
            // This is appended to the object in order to conform to the API spec.
            // When creating a new workout it will never contain any exercise.
            createdWorkout.exercises = [];
            resolve(createdWorkout)
        }, appIsBeingTested)
    });
}

const addExerciseToWorkout = async ({ workoutId, exerciseId, exerciseSet, reps, weight, timeInSeconds }, 
                                      appIsBeingTested = undefined) => {
    // Build query
    // TODO take into account exerciseSet as primary key too, i.e. handle duplicity and something more if needed
    let requiredFields = ['workout_id', 'exercise_id', 'exercise_set'];
    let requiredValues = [workoutId, exerciseId, exerciseSet];

    let optionalFields = ['exercise_reps', 'exercise_weight', 'exercise_time_in_seconds'];
    let optionalValues = [reps, weight, timeInSeconds];

    let returningFields = ['exercise_id AS exerciseId', 
                           'exercise_set AS exerciseSet', 
                           'exercise_reps AS reps', 
                           'exercise_weight AS weight', 
                           'exercise_time_in_seconds AS time_in_seconds'];

    const { q, params } = qh.createInsertIntoTableStatement('workouts_exercises', 
                                                           requiredFields, requiredValues,
                                                           optionalFields, optionalValues,
                                                           returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const addedExercise = results.rows[0];
            resolve(addedExercise)
        }, appIsBeingTested)
    });
}

const checkWorkoutByIdExists = async (id, appIsBeingTested = undefined) => {
    let q = "SELECT id FROM " + TABLE_NAME + " WHERE id = $1;";
    const params = [id]

    const selectedWorkout = await new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const workoutId = results.rows[0];
            resolve(workoutId)
        }, appIsBeingTested)
    });

    if (!selectedWorkout) {
        return false;
    }

    return Number.isInteger(selectedWorkout.id);
}

module.exports = {
    createWorkouts,
    addExerciseToWorkout,
    checkWorkoutByIdExists,
};