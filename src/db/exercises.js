const { query } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'exercises';

const createExercise = ({ alias, description }, appIsBeingTested = undefined) => {
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

const selectExerciseById = (id, appIsBeingTested) => {
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

    // TODO include workout exercises in response

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedExercise = results.rows[0];
            resolve(updatedExercise)
        }, appIsBeingTested)
    });
}

const deleteExercise = async (id, appIsBeingTested = undefined) => {
    let q = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " + 
            "RETURNING id, alias, description;";
    const params = [id]

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const deletedExercise = results.rows[0];
            resolve(deletedExercise)
        }, appIsBeingTested)
    });
}

const checkExerciseByIdExists = async (id, appIsBeingTested = undefined) => {
    let q = "SELECT id FROM " + TABLE_NAME + " WHERE id = $1;";
    const params = [id]

    const selectedExercise = await new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const exercise = results.rows[0];
            resolve(exercise)
        }, appIsBeingTested)
    });

    if (!selectedExercise) {
        return false;
    }

    return Number.isInteger(selectedExercise.id);
}

const selectIdForExerciseName = (name, appIsBeingTested) => {
    // TODO DELETE THESE DEBUG LOGS
    console.log('Enters select id from db module');
    console.log(`name: '${name}'`);

    const q = "SELECT id FROM " + TABLE_NAME + " WHERE alias = $1;";
    const params = [name];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            // if (error) reject(error);
            if (error) {
                // TODO DELETE THESE DEBUG LOGS
                console.log('error');
                console.log(error);
                throw new Error(error);
            };
            // TODO DELETE THESE DEBUG LOGS
            console.log('No error');
            console.log(results.rows);

            // TODO handle better this error or delete it
            if (results.rows.length === 0) {
                throw new Error('DEBUG TESTS ERROR. NO ROWS FOUND');
            }

            const exerciseId = results.rows[0].id;

            // TODO DELETE THESE DEBUG LOGS
            console.log('resolving promise');
            resolve(exerciseId)
        }, appIsBeingTested)
    });
};

module.exports = {
    createExercise,
    updateExercise,
    deleteExercise,
    selectAllExercises,
    selectExerciseById,
    checkExerciseByIdExists,
    selectIdForExerciseName,
};