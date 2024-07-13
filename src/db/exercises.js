const { query, getPoolClient } = require('./index');
const qh = require('./queryHelper.js');

const TABLE_NAME = 'exercises';

const createExercise = async (userId, { alias, description }, appIsBeingTested = undefined) => {
    const client = await getPoolClient(appIsBeingTested);
    let results;
    try {
        await client.query('BEGIN;');

        // Insert delete in exercises table
        // Build query
        let requiredFields = ['alias'];
        let requiredValues = [alias];

        let optionalFields = ['description'];
        let optionalValues = [description];

        let returningFields = ['id', 'alias', 'description'];

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

const selectAllExercisesFromUser = (userId, appIsBeingTested) => {
    const q = "SELECT " +
        "    ex.id,  " +
        "    ex.alias as name,  " +
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

        // Delete references in users_exercises
        const usersExercisesQuery = "DELETE FROM users_exercises WHERE exercise_id = $1;";
        const usersExercisesParams = [id];
        await client.query(usersExercisesQuery, usersExercisesParams);

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

const exerciseBelongsToUser = (exerciseId, userId, appIsBeingTested) => {
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
        }, appIsBeingTested)
    });
};

const truncateTableTest = async (appIsBeingTested) => {
    if (!appIsBeingTested) {
        return new Promise((resolve, reject) => {
            // Test for making malicious people think they got something
            resolve('Truncated ' + TABLE_NAME);
        });
    }

    const client = await getPoolClient(appIsBeingTested);
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
    selectAllExercisesFromUser,
    selectExerciseById,
    checkExerciseByIdExists,
    selectIdForExerciseName,
    exerciseBelongsToUser,
    truncateTableTest,
};