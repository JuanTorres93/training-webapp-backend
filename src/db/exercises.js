const { query } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'exercises';

const createExercise = async ({ alias, description }, appIsBeingTested = undefined) => {

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

            const createdExercise = results.rows[0];
            resolve(createdExercise)
        }, appIsBeingTested)
    });
}

const selectAllExercises = (appIsBeingTested) => {
    const q = "SELECT id, alias, description FROM " + TABLE_NAME + ";";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercises = results.rows;
            resolve(exercises)
        }, appIsBeingTested)
    });
};

const selectExerciseById = async (id, appIsBeingTested) => {
    const q = "SELECT id, alias, description FROM " +
              TABLE_NAME + " WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercise = results.rows[0];
            resolve(exercise)
        }, appIsBeingTested)
    });
};

const updateExercise = async (id, exerciseObject, appIsBeingTested = undefined) => {
    const returningFields = ['id', 'alias', 'description'];

    const { q, params } = qh.createUpdateTableStatement(TABLE_NAME, id, 
                                                        exerciseObject,
                                                        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedExercise = results.rows[0];
            resolve(updatedExercise)
        }, appIsBeingTested)
    });
}

module.exports = {
    createExercise,
    updateExercise,
    selectAllExercises,
    selectExerciseById,
};