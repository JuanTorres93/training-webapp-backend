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

module.exports = {
    createWorkouts,
};