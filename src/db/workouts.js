const { query, getPoolClient } = require("./index");
const qh = require("./queryHelper.js");

const TABLE_NAME = "workouts";

// const workoutsWithExercisesQueryOld = "SELECT  " +
//     "	wk.id AS workout_id,  " +
//     "	wk.name AS workout_name, 	 " +
//     "	wk.description AS workout_description, " +
//     "	e.id AS exercise_id, " +
//     "	e.name AS exercise_name, " +
//     "	w_e.exercise_set AS exercise_set, " +
//     "	w_e.exercise_reps AS exercise_reps, " +
//     "	w_e.exercise_weight AS exercise_weight, " +
//     "	w_e.exercise_time_in_seconds AS exercise_time_in_seconds " +
//     "FROM " + TABLE_NAME + " AS wk " +
//     "LEFT JOIN workouts_exercises AS w_e ON wk.id = w_e.workout_id " +
//     "LEFT JOIN exercises AS e ON w_e.exercise_id = e.id " +
//     "WHERE TRUE " + // This condition is here for DRYING the code replacing it where necessary
//     "ORDER BY workout_id, exercise_id, exercise_set " +
//     "; ";

const workoutsWithExercisesQuery =
  "SELECT  " +
  "   wk.id AS workout_id,	" +
  "   wkt.id AS workout_template_id,	" +
  "   wkt.name AS workout_name,	" +
  "   wk.description AS workout_description, 	" +
  "   e.id AS exercise_id, 	" +
  "   e.name AS exercise_name, 	" +
  "   w_e.exercise_set AS exercise_set, 	" +
  "   w_e.exercise_reps AS exercise_reps, 	" +
  "   w_e.exercise_weight AS exercise_weight, 	" +
  "   w_e.exercise_time_in_seconds AS exercise_time_in_seconds 	" +
  "FROM " +
  TABLE_NAME +
  " AS wk " +
  "LEFT JOIN workout_template as wkt ON wk.template_id = wkt.id   " +
  "LEFT JOIN workouts_exercises AS w_e ON wk.id = w_e.workout_id " +
  "LEFT JOIN exercises AS e ON w_e.exercise_id = e.id " +
  "WHERE TRUE " + // This condition is here for DRYING the code replacing it where necessary
  "ORDER BY workout_id, exercise_id, exercise_set " +
  "; ";

const createWorkouts = async (userId, { template_id, description }) => {
  const client = await getPoolClient(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction

    // Build query
    let requiredFields = ["template_id"];
    let requiredValues = [template_id];

    let optionalFields = ["description"];
    let optionalValues = [description];

    let returningFields = ["id", "template_id", "description"];

    const { q, params } = qh.createInsertIntoTableStatement(
      TABLE_NAME,
      requiredFields,
      requiredValues,
      optionalFields,
      optionalValues,
      returningFields
    );

    const results = await client.query(q, params); // Execute query within transaction

    const createdWorkout = results.rows[0];

    // This is appended to the object in order to conform to the API spec.
    // When creating a new workout it will never contain any exercise.
    createdWorkout.exercises = [];

    // Insert into users_workouts user_id, workout_id and current date, including time
    const usersWorkoutsQuery =
      "INSERT INTO users_workouts (user_id, workout_id, start_date) " +
      "VALUES ($1, $2, NOW() AT TIME ZONE 'UTC');";
    const usersWorkoutsParams = [userId, createdWorkout.id];

    await client.query(usersWorkoutsQuery, usersWorkoutsParams); // Execute query within transaction

    // Select info to return to user according to the API spec
    const templateNameQuery =
      "SELECT name FROM workout_template WHERE id = $1;";
    const templateNameParams = [template_id];

    const resultsTemplateName = await client.query(
      templateNameQuery,
      templateNameParams
    ); // Execute query within transaction
    const templateName = resultsTemplateName.rows[0].name;

    createdWorkout.name = templateName;

    await client.query("COMMIT"); // Commit transaction

    return createdWorkout;
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    throw error;
  } finally {
    client.release(); // Release client back to the pool
  }
};

const updateWorkout = async (id, workoutObject) => {
  const client = await getPoolClient();
  let results;

  try {
    await client.query("BEGIN;");

    // Update workout
    const { q: updateQuery, params: updateParams } =
      qh.createUpdateTableStatement(TABLE_NAME, id, workoutObject);

    await client.query(updateQuery, updateParams);

    const returnInfoQuery = workoutsWithExercisesQuery.replace(
      "WHERE TRUE",
      "WHERE wk.id = $1"
    );
    const returnInfoParams = [id];

    results = await client.query(returnInfoQuery, returnInfoParams);
    await client.query("COMMIT;");
  } catch (e) {
    await client.query("ROLLBACK;");
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
};

const addFinishDateToWorkout = async (workoutId) => {
  // TODO test this function
  const client = await getPoolClient();
  let results;

  try {
    await client.query("BEGIN;");

    const updateQuery =
      "UPDATE users_workouts SET end_date = NOW() AT TIME ZONE 'UTC' WHERE workout_id = $1;";
    const updateParams = [workoutId];

    await client.query(updateQuery, updateParams);

    const returnInfoQuery = workoutsWithExercisesQuery.replace(
      "WHERE TRUE",
      "WHERE wk.id = $1"
    );
    const returnInfoParams = [workoutId];

    results = await client.query(returnInfoQuery, returnInfoParams);
    await client.query("COMMIT;");
  } catch (e) {
    await client.query("ROLLBACK;");
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
};

const addExerciseToWorkout = async ({
  workoutId,
  exerciseId,
  exerciseSet,
  reps,
  weight,
  timeInSeconds,
}) => {
  // Build query
  // TODO take into account exerciseSet as primary key too, i.e. handle duplicity and something more if needed
  let requiredFields = ["workout_id", "exercise_id", "exercise_set"];
  let requiredValues = [workoutId, exerciseId, exerciseSet];

  let optionalFields = [
    "exercise_reps",
    "exercise_weight",
    "exercise_time_in_seconds",
  ];
  let optionalValues = [reps, weight, timeInSeconds];

  let returningFields = [
    "exercise_id AS exerciseId",
    "exercise_set AS exerciseSet",
    "exercise_reps AS reps",
    "exercise_weight AS weight",
    "exercise_time_in_seconds AS time_in_seconds",
  ];

  const { q, params } = qh.createInsertIntoTableStatement(
    "workouts_exercises",
    requiredFields,
    requiredValues,
    optionalFields,
    optionalValues,
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const addedExercise = results.rows[0];
      resolve(addedExercise);
    });
  });
};

const checkWorkoutByIdExists = async (id) => {
  let q = "SELECT id FROM " + TABLE_NAME + " WHERE id = $1;";
  const params = [id];

  const selectedWorkout = await new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const workoutId = results.rows[0];
      resolve(workoutId);
    });
  });

  if (!selectedWorkout) {
    return false;
  }

  return Number.isInteger(selectedWorkout.id);
};

const checkExerciseInWorkoutExists = async (workoutId, exerciseId) => {
  let q =
    "SELECT workout_id FROM workouts_exercises WHERE workout_id = $1 AND exercise_id = $2;";
  const params = [workoutId, exerciseId];

  const selectedWorkout = await new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const workoutId = results.rows[0];
      resolve(workoutId);
    });
  });

  if (!selectedWorkout) {
    return false;
  }

  // check selectedWorkout is UUID
  const uuidRegex = new RegExp(
    "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
  );

  if (!uuidRegex.test(selectedWorkout.workout_id)) {
    return false;
  }

  return true;
};

const workoutBelongsToUser = (workoutId, userId) => {
  const q = `
        SELECT * FROM ${TABLE_NAME} AS wk
        JOIN users_workouts AS uw ON wk.id = uw.workout_id
        WHERE wk.id = $1 AND uw.user_id = $2;
    `;

  const params = [workoutId, userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      if (results.rows.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const getAllWorkoutsIdsFromTemplateId = (templateId, userId) => {
  const q = ` 
    SELECT w.id AS workout_id
    FROM workouts w
    JOIN workout_template wt ON w.template_id = wt.id
    JOIN users u ON wt.user_id = u.id
    WHERE
    	wt.id = $1 and 
    	u.id = $2;
    `;

  const params = [templateId, userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const ids = results.rows;

      if (results.rows.length > 0) {
        resolve(ids);
      } else {
        resolve([]);
      }
    });
  });
};

const _compactWorkoutInfo = (workoutInfoDb) => {
  // workoutInfoDb represents all rows in the table modeling a workout
  const firstRow = workoutInfoDb[0];

  const workoutSpec = {
    id: firstRow.workout_id,
    template_id: firstRow.workout_template_id,
    name: firstRow.workout_name,
    description: firstRow.workout_description,
    exercises: [],
  };

  // Add date only if it exists
  if (firstRow.start_date !== undefined) {
    workoutSpec.startDate = firstRow.start_date;
  }

  // Add template_id only if it exists
  if (firstRow.template_id !== undefined) {
    workoutSpec.template_id = firstRow.template_id;
  }

  workoutInfoDb.forEach((row) => {
    const exerciseSet = {
      id: row.exercise_id,
      name: row.exercise_name,
      set: row.exercise_set,
      reps: row.exercise_reps,
      weight: row.exercise_weight,
      time_in_seconds: row.exercise_time_in_seconds,
    };

    // Add exercise_order only if it exists
    if (row.exercise_order !== undefined) {
      exerciseSet.order = row.exercise_order;
    }

    workoutSpec.exercises.push(exerciseSet);
  });

  return workoutSpec;
};

const selectAllWorkouts = () => {
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
      const distinctWorkoutIds = [
        ...new Set(
          everyWorkout.map((workout) => {
            return workout.workout_id;
          })
        ),
      ];

      if (distinctWorkoutIds.length === 0) {
        resolve([]);
      }

      distinctWorkoutIds.forEach((workoutId) => {
        const workoutInfo = everyWorkout.filter((wk) => {
          return wk.workout_id === workoutId;
        });

        const workoutSpec = _compactWorkoutInfo(workoutInfo);

        allWorkoutsFormatted.push(workoutSpec);
      });

      resolve(allWorkoutsFormatted);
    });
  });
};

const selectworkoutById = (id) => {
  const q = workoutsWithExercisesQuery.replace(
    "WHERE TRUE",
    "WHERE wk.id = $1"
  );
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
    });
  });
};

const selectLastWorkoutFromUser = (templateId, userId) => {
  const q = `
        WITH LatestDate AS (
            SELECT MAX(uw.start_date) AS max_start_date
            FROM workouts w
            JOIN users_workouts uw ON w.id = uw.workout_id
            JOIN workout_template wt ON w.template_id = wt.id
            JOIN workout_template_exercises wt_e ON wt.id = wt_e.workout_template_id
            JOIN workouts_exercises w_e ON w.id = w_e.workout_id
            JOIN exercises e ON w_e.exercise_id = e.id
            WHERE uw.user_id = $1 AND wt.id = $2
        )
        
        SELECT
            w.id AS workout_id,
            wt.id AS template_id,
            wt.name AS workout_name,
            w.description AS workout_description,
            uw.start_date,
            e.id AS exercise_id,
            e.name AS exercise_name,
            wt_e.exercise_order,
            w_e.exercise_set AS exercise_set,
            w_e.exercise_reps AS exercise_reps,
            w_e.exercise_weight AS exercise_weight,
            w_e.exercise_time_in_seconds AS exercise_time_in_seconds
        FROM workouts w
        JOIN users_workouts uw ON w.id = uw.workout_id
        JOIN workout_template wt ON w.template_id = wt.id
        JOIN workout_template_exercises wt_e ON wt.id = wt_e.workout_template_id
        JOIN workouts_exercises w_e ON w.id = w_e.workout_id AND wt_e.exercise_id = w_e.exercise_id
        JOIN exercises e ON w_e.exercise_id = e.id
        JOIN LatestDate ld ON uw.start_date = ld.max_start_date
        WHERE uw.user_id = $1 AND wt.id = $2
        ORDER BY w.id, wt_e.exercise_order, e.id, w_e.exercise_set;
    `;
  const params = [userId, templateId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const workoutInfo = results.rows;

      if (workoutInfo.length === 0) {
        // there is no previous workout
        return resolve({});
      }

      // If workout does not exists
      if (workoutInfo.length === 0) {
        return resolve(undefined);
      }

      // Group results by workout id
      const workoutSpec = _compactWorkoutInfo(workoutInfo);

      resolve(workoutSpec);
    });
  });
};

const selectLastNWorkoutsFromUser = (templateId, userId, numberOfWorkouts) => {
  const q = `        
        WITH LatestDates AS (
            SELECT DISTINCT 
            	uw.start_date AS dates
            FROM workouts w
            JOIN users_workouts uw ON w.id = uw.workout_id
            JOIN workout_template wt ON w.template_id = wt.id
            JOIN workout_template_exercises wt_e ON wt.id = wt_e.workout_template_id
            JOIN workouts_exercises w_e ON w.id = w_e.workout_id
            JOIN exercises e ON w_e.exercise_id = e.id
            WHERE uw.user_id = $1
            AND wt.id = $2
            ORDER BY dates DESC
            LIMIT $3	         
        )

        SELECT
            w.id AS workout_id,
            wt.name AS workout_name,
            wt.id AS template_id,
            w.description AS workout_description,
            uw.start_date,
            e.id AS exercise_id,
            e.name AS exercise_name,
            wt_e.exercise_order,
            w_e.exercise_set AS exercise_set,
            w_e.exercise_reps AS exercise_reps,
            w_e.exercise_weight AS exercise_weight,
            w_e.exercise_time_in_seconds AS exercise_time_in_seconds
        FROM workouts w
        JOIN users_workouts uw ON w.id = uw.workout_id
        JOIN workout_template wt ON w.template_id = wt.id
        JOIN workout_template_exercises wt_e ON wt.id = wt_e.workout_template_id
        JOIN workouts_exercises w_e ON w.id = w_e.workout_id AND wt_e.exercise_id = w_e.exercise_id
        JOIN exercises e ON w_e.exercise_id = e.id
        --JOIN LatestDates ld ON uw.start_date = ld.dates
        WHERE uw.user_id = $1 AND wt.id = $2 AND uw.start_date IN (SELECT dates FROM LatestDates)
        ORDER BY w.id, wt_e.exercise_order, e.id, w_e.exercise_set;
    `;
  const params = [userId, templateId, numberOfWorkouts];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      if (results.rows.length === 0) {
        return resolve([]);
      }

      const workoutsInfo = results.rows;

      // If workout does not exists
      if (workoutsInfo.length === 0) {
        return resolve(undefined);
      }

      // Group results by workout start_date
      const groupByStartDate = (data) => {
        return data.reduce((acc, curr) => {
          const startDate = curr.start_date;
          if (!acc[startDate]) {
            acc[startDate] = [];
          }
          acc[startDate].push(curr);
          return acc;
        }, {});
      };

      const groupedData = groupByStartDate(workoutsInfo);

      const allWorkoutsFormatted =
        Object.values(groupedData).map(_compactWorkoutInfo);

      resolve(allWorkoutsFormatted);
    });
  });
};

const truncateTableTest = () => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  // Only allow truncating table if app is being tested
  if (!appIsBeingTested) {
    return new Promise((resolve, reject) => {
      // Test for making malicious people think they got something
      resolve("Truncated " + TABLE_NAME);
    });
  }

  const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
  const params = [];

  return new Promise((resolve, reject) => {
    query(
      q,
      params,
      (error, results) => {
        if (error) reject(error);

        resolve("Table " + TABLE_NAME + " truncated in test db.");
      },
      true
    );
  });
};

const deleteWorkout = async (id) => {
  // TODO WARNING: There's a potencial risk of unreferenced items in workout_template_exercises?
  const client = await getPoolClient();
  let workoutInfo;

  try {
    await client.query("BEGIN;");

    // Get info to be deleted to return it to user
    const infoQuery = workoutsWithExercisesQuery.replace(
      "WHERE TRUE",
      "WHERE wk.id = $1"
    );
    const infoParams = [id];
    workoutInfo = await client.query(infoQuery, infoParams);

    // Delete references in users_workouts
    const usersWorkoutsQuery =
      "DELETE FROM users_workouts WHERE workout_id = $1;";
    const usersWorkoutsParams = [id];
    await client.query(usersWorkoutsQuery, usersWorkoutsParams);

    // Delete references in workouts_exercises
    const workoutsExercisesQuery =
      "DELETE FROM workouts_exercises WHERE workout_id = $1;";
    const workoutsExercisesParams = [id];
    await client.query(workoutsExercisesQuery, workoutsExercisesParams);

    // Delete workout itself
    const workoutsQuery =
      "DELETE FROM " +
      TABLE_NAME +
      " WHERE id = $1 " +
      "RETURNING id, description;";
    const workoutsParams = [id];
    await client.query(workoutsQuery, workoutsParams);

    await client.query("COMMIT;");
  } catch (e) {
    await client.query("ROLLBACK;");
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
};

const updateExerciseFromWorkout = (
  workoutId,
  { exerciseId, exerciseSet, reps, weight, time_in_seconds }
) => {
  if (
    reps === undefined &&
    weight === undefined &&
    time_in_seconds === undefined
  ) {
    return;
  }

  const fieldsToUpdate = {
    exercise_reps: reps,
    exercise_weight: weight,
    exercise_time_in_seconds: time_in_seconds,
  };

  let paramDolarCounter = 1;

  // Build query
  const params = [];
  let q = "UPDATE workouts_exercises SET ";

  for (const [field, value] of Object.entries(fieldsToUpdate)) {
    if (value !== undefined) {
      const val = value === "" ? null : value;
      q += `${field} = $${paramDolarCounter}, `;
      params.push(val);
      paramDolarCounter += 1;
    }
  }

  q = q.substring(0, q.length - 2) + " ";
  q += "WHERE ";
  q += `workout_id = $${paramDolarCounter} AND `;
  q += `exercise_id = $${paramDolarCounter + 1} AND `;
  q += `exercise_set = $${paramDolarCounter + 2} `;
  q +=
    "RETURNING  " +
    "	exercise_id,  " +
    "	exercise_set,  " +
    "	exercise_reps AS reps,  " +
    "	exercise_weight AS weight,  " +
    "	exercise_time_in_seconds AS time_in_seconds;";

  params.push(workoutId);
  params.push(exerciseId);
  params.push(exerciseSet);

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const updatedExercise = results.rows[0];
      const updatedExerciseSpec = {
        exerciseId: updatedExercise.exercise_id,
        exerciseSet: updatedExercise.exercise_set,
        reps: updatedExercise.reps,
        weight: updatedExercise.weight,
        time_in_seconds: updatedExercise.time_in_seconds,
      };
      resolve(updatedExerciseSpec);
    });
  });
};

const deleteExerciseFromWorkout = (workoutId, exerciseId) => {
  const q =
    " WITH deleted AS ( " +
    " 	DELETE FROM workouts_exercises " +
    " 	WHERE " +
    " 		workout_id = $1 AND " +
    " 		exercise_id = $2 " +
    " 	RETURNING  " +
    " 		exercise_id, " +
    " 		exercise_set, " +
    " 		exercise_reps, " +
    " 		exercise_weight, " +
    " 		exercise_time_in_seconds " +
    " ) " +
    " SELECT * FROM deleted " +
    " ORDER BY exercise_id, exercise_set; ";

  const params = [workoutId, exerciseId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const exercisesRows = results.rows;
      const exercisesSpec = [];

      exercisesRows.forEach((row) => {
        exercisesSpec.push({
          exerciseId: row.exercise_id,
          exerciseSet: row.exercise_set,
          reps: row.exercise_reps,
          weight: row.exercise_weight,
          time_in_seconds: row.exercise_time_in_seconds,
        });
      });

      resolve(exercisesSpec);
    });
  });
};

const deleteSetFromExercise = (workoutId, exerciseId, exerciseSet) => {
  const q =
    " WITH deleted AS ( " +
    " 	DELETE FROM workouts_exercises " +
    " 	WHERE " +
    " 		workout_id = $1 AND " +
    " 		exercise_id = $2 AND " +
    " 		exercise_set = $3 " +
    " 	RETURNING  " +
    " 		exercise_id, " +
    " 		exercise_set, " +
    " 		exercise_reps, " +
    " 		exercise_weight, " +
    " 		exercise_time_in_seconds " +
    " ) " +
    " SELECT * FROM deleted " +
    " ORDER BY exercise_id, exercise_set; ";

  const params = [workoutId, exerciseId, exerciseSet];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const exercisesRows = results.rows;
      const exercisesSpec = [];

      exercisesRows.forEach((row) => {
        exercisesSpec.push({
          exerciseId: row.exercise_id,
          exerciseSet: row.exercise_set,
          reps: row.exercise_reps,
          weight: row.exercise_weight,
          time_in_seconds: row.exercise_time_in_seconds,
        });
      });

      resolve(exercisesSpec[0]);
    });
  });
};

module.exports = {
  // CREATE
  createWorkouts,
  addExerciseToWorkout,

  // UPDATE
  updateWorkout,
  updateExerciseFromWorkout,
  addFinishDateToWorkout,

  // SELECT
  selectAllWorkouts,
  selectworkoutById,
  selectLastWorkoutFromUser,
  selectLastNWorkoutsFromUser,
  getAllWorkoutsIdsFromTemplateId,

  // DELETE
  deleteWorkout,
  deleteExerciseFromWorkout,
  deleteSetFromExercise,

  // EXTRA
  truncateTableTest,

  checkWorkoutByIdExists,
  checkExerciseInWorkoutExists,
  workoutBelongsToUser,
};
