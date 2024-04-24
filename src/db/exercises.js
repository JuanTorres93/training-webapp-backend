const { query, getPoolClient } = require('./index');
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

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedExercise = results.rows[0];
            resolve(updatedExercise)
        }, appIsBeingTested)
    });
}

const deleteExercise = async (id, appIsBeingTested = undefined) => {
    // TODO WARNING: There's a potencial risk of unreferenced items in workout_template_exercises
    const client = await getPoolClient(appIsBeingTested);
    let results;
    try {
        await client.query('BEGIN;');

        // Delete references in workouts_exercises
        const workoutsExercisesQuery = "DELETE FROM workouts_exercises WHERE exercise_id = $1;";
        const workoutsExercisesParams = [id];
        await client.query(workoutsExercisesQuery, workoutsExercisesParams);

        // Delete exercise itself
        const exercisesQuery = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " +
                               "RETURNING id, alias, description;";
        const exercisesParams = [id];
        results = await client.query(exercisesQuery, exercisesParams);

        await client.query('COMMIT;');
    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    return results.rows[0];
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
    const q = "SELECT id FROM " + TABLE_NAME + " WHERE alias = $1;";
    const params = [name];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const exerciseId = results.rows[0].id;
            resolve(exerciseId)
        }, appIsBeingTested)
    });
};

const truncateTableTest = (appIsBeingTested) => {
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            resolve('Table ' + TABLE_NAME + ' truncated in test db.')
        }, true)
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
    truncateTableTest,
};