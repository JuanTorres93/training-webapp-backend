const { query } = require('./index');
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
    const returningFields = ['id', 'alias', 'description'];

    const { q, params } = qh.createUpdateTableStatement(TABLE_NAME, id, 
                                                        workoutObject,
                                                        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedWorkout = results.rows[0];

            // TODO DELETE THESE DEBUG LOGS
            console.log('updatedWorkout');
            console.log(updatedWorkout);

            // TODO fetch exercises From db
            //updatedWorkout.exercises = [];

            resolve(updatedWorkout)
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

module.exports = {
    createWorkouts,
    updateWorkout,
    addExerciseToWorkout,
    checkWorkoutByIdExists,
    selectAllWorkouts,
    selectworkoutById,
};