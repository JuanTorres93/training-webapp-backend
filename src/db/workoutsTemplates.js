const { query, getPoolClient } = require('./index');
const utils = require('../utils/utils.js');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'workout_template';

let workoutsTemplatesWithExercisesQuery = "SELECT "
workoutsTemplatesWithExercisesQuery += " 	wkt.id, "
workoutsTemplatesWithExercisesQuery += " 	wkt.alias, "
workoutsTemplatesWithExercisesQuery += " 	wkt.description, "
workoutsTemplatesWithExercisesQuery += " 	ex.id AS exercise_id, "
workoutsTemplatesWithExercisesQuery += " 	ex.alias AS exercise_alias, "
workoutsTemplatesWithExercisesQuery += " 	wkte.exercise_order AS order, "
workoutsTemplatesWithExercisesQuery += " 	wkte.exercise_sets AS sets "
workoutsTemplatesWithExercisesQuery += " FROM workout_template AS wkt "
workoutsTemplatesWithExercisesQuery += " JOIN workout_template_exercises AS wkte ON wkt.id = wkte.workout_template_id "
workoutsTemplatesWithExercisesQuery += " JOIN exercises AS ex ON wkte.exercise_id = ex.id "
workoutsTemplatesWithExercisesQuery += " WHERE TRUE "
workoutsTemplatesWithExercisesQuery += " ORDER BY wkt.id, wkte.exercise_order; "


const _compactWorkoutTemplateInfo = (workoutTemplateInfoDb) => {
    // workoutTemplateInfoDb represents all rows in the table modeling a workout template
    const firstRow = workoutTemplateInfoDb[0];

    const workoutTemplateSpec = {
        id: firstRow.id,
        alias: firstRow.alias,
        description: firstRow.description,
        exercises: [],
    };

    workoutTemplateInfoDb.forEach(row => {
        workoutTemplateSpec.exercises.push({
            id: row.exercise_id,
            alias: row.exercise_alias,
            sets: row.sets,
            order: row.order,
        });
    });

    return workoutTemplateSpec;
};

const selectAllWorkoutsTemplates = (appIsBeingTested) => {
    const q = workoutsTemplatesWithExercisesQuery;
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const everyWorkoutTemplate = results.rows;

            const allTemplatesFormatted = [];

            // Group results by template id
            // Get unique templates ids
            // DOCS: Source https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript
            const distinctWorkoutTemplatesIds = [...new Set(everyWorkoutTemplate.map((template) => {
                return template.workout_template_id;
            }))];

            if (distinctWorkoutTemplatesIds.length === 0) {
                resolve([]);
            }

            distinctWorkoutTemplatesIds.forEach(workoutTemplateId => {
                const templateInfo = everyWorkoutTemplate.filter((wk) => {
                    return wk.workout_template_id === workoutTemplateId
                })

                const workoutTemplateSpec = _compactWorkoutTemplateInfo(templateInfo);

                allTemplatesFormatted.push(workoutTemplateSpec);
            });

            resolve(allTemplatesFormatted)
        }, appIsBeingTested)
    });
};

const createWorkoutTemplate = ({ userId, alias, description }, appIsBeingTested = undefined) => {
    // Build query
    let requiredFields = ['user_id', 'alias'];
    let requiredValues = [userId, alias];

    let optionalFields = ['description'];
    let optionalValues = [description];

    let returningFields = ['id', 'user_id', 'alias', 'description'];

    const { q, params } = qh.createInsertIntoTableStatement(TABLE_NAME, 
                                                           requiredFields, requiredValues,
                                                           optionalFields, optionalValues,
                                                           returningFields);

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const createdWorkoutTemplate = results.rows[0];
            const specWorkoutTemplate = {
                ...createdWorkoutTemplate,
                userId: createdWorkoutTemplate.user_id,
            };

            delete specWorkoutTemplate.user_id

            resolve(specWorkoutTemplate)
        }, appIsBeingTested)
    });
}

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
    selectAllWorkoutsTemplates,
    createWorkoutTemplate,
    truncateTableTest,
};
