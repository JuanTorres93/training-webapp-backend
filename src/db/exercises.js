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

const updateExercise = async (id, exerciseObject, appIsBeingTested = undefined) => {
    let q = 'UPDATE exercises SET ';
    const params = []
    let variableCount = 1;

    Object.keys(exerciseObject).forEach(field => {

        if (exerciseObject[field] !== undefined) {
            q += `${field} = $${variableCount}, `;
            variableCount++;
            params.push(exerciseObject[field]);
        }
    });

    q = q.substring(0, q.length - 2) + " ";
    q += `WHERE id = $${variableCount} `; 
    params.push(id);

    q += 'RETURNING id, alias, description;';

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