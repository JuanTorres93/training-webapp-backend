const { query } = require('./index');
const utils = require('../utils/utils.js');

const createExercise = async (alias, description = undefined, 
                              appIsBeingTested = undefined) => {

    // Build query
    let requiredFields = ['alias'];
    let requiredValues = [alias];

    let optionalFields = ['description'];
    let optionalValues = [description];

    const {fields, values, params} = utils.buildFieldsAndValuesSQLQuery(requiredFields, requiredValues, optionalFields, optionalValues);

    const q = `INSERT INTO exercises ${fields} ` +
              `VALUES ${values} ` + 
              'RETURNING id, alias, description;';

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdExercise = results.rows[0];
            resolve(createdExercise)
        }, appIsBeingTested)
    });
}

const selectAllExercises = (appIsBeingTested) => {
    const q = "SELECT id, alias, description FROM exercises;";
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
              "exercises WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercise = results.rows[0];
            resolve(exercise)
        }, appIsBeingTested)
    });
};

module.exports = {
    createExercise,
    selectAllExercises,
    selectExerciseById,
};