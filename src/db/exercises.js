const { query, getPoolClient } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'exercises';

const createExercise = async (userId, { name, description }) => {
    const client = await getPoolClient();
    let results;
    try {
        await client.query('BEGIN;');

        // Insert delete in exercises table
        // Build query
        let requiredFields = ['name'];
        let requiredValues = [name];

        let optionalFields = ['description'];
        let optionalValues = [description];

        let returningFields = ['id', 'name', 'description'];

        const { q: insertExerciseQuery,
            params: insertExerciseParams } = qh.createInsertIntoTableStatement(
                TABLE_NAME,
                requiredFields, requiredValues,
                optionalFields, optionalValues,
                returningFields);

        results = await client.query(insertExerciseQuery, insertExerciseParams);
        results = results.rows[0];

        const exerciseId = results.id;

        // Asign exercise to the user that created it
        const usersExercisesQuery = "INSERT INTO users_exercises (user_id, exercise_id) " +
            "VALUES ($1, $2);";
        const usersExercisesParams = [userId, exerciseId];

        await client.query(usersExercisesQuery, usersExercisesParams);

        await client.query('COMMIT;');
    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    return results;
}

const selectAllExercises = () => {
    const q = "SELECT id, name, description FROM " + TABLE_NAME + ";";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercises = results.rows;

            resolve(exercises)
        })
    });
};

const selectCommonExercises = () => {
    const q = "SELECT " +
        "    ex.id,  " +
        "    ex.name as name,  " +
        "    ex.description " +
        "FROM " + TABLE_NAME + " AS ex " +
        "JOIN users_exercises AS us_ex " +
        "ON ex.id = us_ex.exercise_id " +
        "JOIN users AS us " +
        "ON us_ex.user_id = us.id " +
        "WHERE us.email = '" + process.env.DB_COMMON_USER_EMAIL + "' " +
        "ORDER BY ex.id; ";
    const params = [];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercises = results.rows;

            resolve(exercises)
        })
    });
};

const selectAllExercisesFromUser = (userId) => {
    const q = "SELECT " +
        "    ex.id,  " +
        "    ex.name as name,  " +
        "    ex.description " +
        "FROM " + TABLE_NAME + " AS ex " +
        "JOIN users_exercises AS us_ex " +
        "ON ex.id = us_ex.exercise_id " +
        "JOIN users AS us " +
        "ON us_ex.user_id = us.id " +
        "WHERE us.id = $1 " +
        "ORDER BY ex.id; ";
    const params = [userId];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercises = results.rows;

            resolve(exercises)
        })
    });
};

const selectExerciseById = (id) => {
    const q = "SELECT id, name, description FROM " +
        TABLE_NAME + " WHERE id = $1;";
    const params = [id];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);
            const exercise = results.rows[0];
            resolve(exercise)
        })
    });
};

const updateExercise = async (id, exerciseObject) => {
    const returningFields = ['id', 'name', 'description'];

    const { q, params } = qh.createUpdateTableStatement(TABLE_NAME, id,
        exerciseObject,
        returningFields)

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const updatedExercise = results.rows[0];
            resolve(updatedExercise)
        })
    });
}

const deleteExercise = async (id) => {
    const client = await getPoolClient();
    let results;
    try {
        await client.query('BEGIN;');

        // Delete references in workout_template_exercises
        const workoutTemplateExercisesQuery = `
            DELETE FROM workout_template_exercises 
            WHERE exercise_id = $1 
            RETURNING *;
        `;
        const workoutTemplateExercisesParams = [id];
        const deletedExerciseFromTemplate = await client.query(workoutTemplateExercisesQuery, workoutTemplateExercisesParams);
        const deletedExerciseFromTemplateRows = deletedExerciseFromTemplate.rows;
        const deletedExerciseOrders = deletedExerciseFromTemplateRows.map(row => {
            return {
                exerciseOrder: row.exercise_order,
                workoutTemplateId: row.workout_template_id
            };
        });

        // Delete references in workouts_exercises
        const workoutsExercisesQuery = "DELETE FROM workouts_exercises WHERE exercise_id = $1;";
        const workoutsExercisesParams = [id];
        await client.query(workoutsExercisesQuery, workoutsExercisesParams);

        // Delete references in users_exercises
        const usersExercisesQuery = "DELETE FROM users_exercises WHERE exercise_id = $1;";
        const usersExercisesParams = [id];
        await client.query(usersExercisesQuery, usersExercisesParams);

        // Delete exercise itself
        const exercisesQuery = "DELETE FROM " + TABLE_NAME + " WHERE id = $1 " +
            "RETURNING id, name, description;";
        const exercisesParams = [id];
        results = await client.query(exercisesQuery, exercisesParams);

        const promises = [];
        deletedExerciseOrders.forEach(exerciseInfo => {
            const { workoutTemplateId, exerciseOrder } = exerciseInfo;
            // Update exercise order in workout_template_exercises
            const updateWorkoutTemplateExercisesQuery = `
                UPDATE workout_template_exercises 
                SET exercise_order = exercise_order - 1 
                WHERE workout_template_id = $1 
                AND exercise_order > $2;
            `;
            promises.push(client.query(updateWorkoutTemplateExercisesQuery, [workoutTemplateId, exerciseOrder]));
        });

        await Promise.all(promises);

        await client.query('COMMIT;');
    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    return results.rows[0];
}

const checkExerciseByIdExists = async (id) => {
    let q = "SELECT id FROM " + TABLE_NAME + " WHERE id = $1;";
    const params = [id]

    const selectedExercise = await new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const exercise = results.rows[0];
            resolve(exercise)
        })
    });

    if (!selectedExercise) {
        return false;
    }

    return Number.isInteger(selectedExercise.id);
}

const selectIdForExerciseName = (name) => {
    const q = "SELECT id FROM " + TABLE_NAME + " WHERE name = $1;";
    const params = [name];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            const exerciseId = results.rows[0].id;
            resolve(exerciseId)
        })
    });
};

const exerciseBelongsToUser = (exerciseId, userId) => {
    const q = "SELECT * FROM users_exercises WHERE exercise_id = $1 AND user_id = $2;";
    const params = [exerciseId, userId];

    return new Promise((resolve, reject) => {
        query(q, params, (error, results) => {
            if (error) reject(error);

            if (results.rows.length > 0) {
                resolve(true);
            } else {
                resolve(false)
            }
        })
    });
};

const truncateTableTest = async () => {
    const appIsBeingTested = process.env.NODE_ENV === 'test';

    // Only allow truncating table in test environment
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const client = await getPoolClient();
    try {
        await client.query('BEGIN;');
        await client.query("TRUNCATE " + TABLE_NAME + " CASCADE;");
        await client.query("TRUNCATE users_exercises CASCADE;");
        await client.query('COMMIT;');
    } catch (e) {
        await client.query('ROLLBACK;');
        throw e;
    } finally {
        client.release();
    }

    return 'Table ' + TABLE_NAME + ' and users_exercises truncated in test db.';
};

module.exports = {
    createExercise,
    updateExercise,
    deleteExercise,
    selectAllExercises,
    selectCommonExercises,
    selectAllExercisesFromUser,
    selectExerciseById,
    checkExerciseByIdExists,
    selectIdForExerciseName,
    exerciseBelongsToUser,
    truncateTableTest,
};