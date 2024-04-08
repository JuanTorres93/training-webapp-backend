const { query, getPoolClient } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'workouts';

const workoutsWithExercisesQuery = "SELECT  " +
                                    "	wk.id AS workout_id,  " +
                                    "	wk.alias AS workout_alias, 	 " +
                                    "	wk.description AS workout_description, " +
                                    "	e.id AS exercise_id, " +
                                    "	e.alias AS exercise_alias, " +
                                    "	w_e.exercise_set AS exercise_set, " +
                                    "	w_e.exercise_reps AS exercise_reps, " +
                                    "	w_e.exercise_weight AS exercise_weight, " +
                                    "	w_e.exercise_time_in_seconds AS exercise_time_in_seconds " +
                                    "FROM " + TABLE_NAME + " AS wk " +
                                    "LEFT JOIN workouts_exercises AS w_e ON wk.id = w_e.workout_id " +
                                    "LEFT JOIN exercises AS e ON w_e.exercise_id = e.id " +
                                    "WHERE TRUE " + // This condition is here for DRYING the code replacing it where necessary
                                    "ORDER BY workout_id, exercise_id, exercise_set " +
                                    "; ";

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
};

const updateWorkout = async (id, workoutObject, appIsBeingTested = undefined) => {
    const client = await getPoolClient(appIsBeingTested);
    let results;

    try {
        await client.query('BEGIN;');

        // Update workout
        const { q: updateQuery, params: updateParams } = qh.createUpdateTableStatement(TABLE_NAME, id, 
                                                            workoutObject)

        await client.query(updateQuery, updateParams);

        const returnInfoQuery = workoutsWithExercisesQuery.replace('WHERE TRUE', 
                                                                   'WHERE wk.id = $1');
        const returnInfoParams = [id];

        results = await client.query(returnInfoQuery, returnInfoParams);
        await client.query('COMMIT;');

    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    const workoutInfo = results.rows;
            
    // If workout does not exists
    if (workoutInfo.length === 0) {
        return undefined;
    }

    // Group results by workout id
    const workoutSpec = _compactWorkoutInfo(workoutInfo);
    
    return workoutSpec;
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
};

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
};

const _compactWorkoutInfo = (workoutInfoDb) => {
    // workoutInfoDb represents all rows in the table modeling a workout
    const firstRow = workoutInfoDb[0];

    const workoutSpec = {
        id: firstRow.workout_id,
        alias: firstRow.workout_alias,
        description: firstRow.workout_description,
        exercises: [],
    };

    workoutInfoDb.forEach(row => {
        workoutSpec.exercises.push({
            id: row.exercise_id,
            alias: row.exercise_alias,
            set: row.exercise_set,
            reps: row.exercise_reps,
            weight: row.exercise_weight,
            time_in_seconds: row.exercise_time_in_seconds,
        });
    });

    return workoutSpec;
}

const selectAllWorkouts = (appIsBeingTested) => {
    const q = workoutsWithExercisesQuery;
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const everyWorkout = results.rows;

            const allWorkoutsFormatted = [];

            // Group results by workout id
            // Get unique workouts ids
            // DOCS: Source https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript
            const distinctWorkoutIds = [...new Set(everyWorkout.map((workout) => {
                return workout.workout_id;
            }))];

            if (distinctWorkoutIds.length === 0) {
                resolve([]);
            }

            distinctWorkoutIds.forEach(workoutId => {
                const workoutInfo = everyWorkout.filter((wk) => {
                    return wk.workout_id === workoutId
                })

                const workoutSpec = _compactWorkoutInfo(workoutInfo);

                allWorkoutsFormatted.push(workoutSpec);
            });

            resolve(allWorkoutsFormatted)
        }, appIsBeingTested)
    });
};

const selectworkoutById = (id, appIsBeingTested) => {
    const q = workoutsWithExercisesQuery.replace('WHERE TRUE', 
                                            'WHERE wk.id = $1');
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const workoutInfo = results.rows;
            
            // If workout does not exists
            if (workoutInfo.length === 0) {
                return resolve(undefined);
            }

            // Group results by workout id
            const workoutSpec = _compactWorkoutInfo(workoutInfo);

            resolve(workoutSpec);
        }, appIsBeingTested)
    });
};


const truncateTableTest = (appIsBeingTested) => {
    if (appIsBeingTested) {
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

const deleteWorkout = async (id, appIsBeingTested = undefined) => {
    // TODO WARNING: There's a potencial risk of unreferenced items in workout_template_exercises
    const client = await getPoolClient(appIsBeingTested);
    let workoutInfo;

    try {
        await client.query('BEGIN;');

        // Get info to be deleted to return it to user
        const infoQuery = workoutsWithExercisesQuery.replace('WHERE TRUE', 
                                                'WHERE wk.id = $1');
        const infoParams = [id];
        workoutInfo = await client.query(infoQuery, infoParams);

        // Delete references in workouts_exercises
        const workoutsExercisesQuery = "DELETE FROM workouts_exercises WHERE workout_id = $1;";
        const workoutsExercisesParams = [id];
        await client.query(workoutsExercisesQuery, workoutsExercisesParams);

        // Delete workout itself
        const workoutsQuery = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " +
                              "RETURNING id, alias, description;";
        const workoutsParams = [id];
        await client.query(workoutsQuery, workoutsParams);

        await client.query('COMMIT;');
    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    // Get results from query
    workoutInfo = workoutInfo.rows;
            
    // If workout does not exists
    if (workoutInfo.length === 0) {
        return undefined;
    }

    // Group results by workout id
    const workoutSpec = _compactWorkoutInfo(workoutInfo);

    return workoutSpec;
}

module.exports = {
    createWorkouts,
    updateWorkout,
    addExerciseToWorkout,
    checkWorkoutByIdExists,
    selectAllWorkouts,
    selectworkoutById,
    truncateTableTest,
    deleteWorkout,
};