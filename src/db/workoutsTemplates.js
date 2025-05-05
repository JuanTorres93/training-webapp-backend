const { query, getPoolClient } = require("./index");
const qh = require("./queryHelper.js");
const userDb = require("./users.js");

const TABLE_NAME = "workout_template";

let workoutsTemplatesWithExercisesQuery = "SELECT ";
workoutsTemplatesWithExercisesQuery += " 	wkt.id, ";
workoutsTemplatesWithExercisesQuery += " 	wkt.name, ";
workoutsTemplatesWithExercisesQuery += " 	wkt.description, ";
workoutsTemplatesWithExercisesQuery += " 	ex.id AS exercise_id, ";
workoutsTemplatesWithExercisesQuery += " 	ex.name AS exercise_name, ";
workoutsTemplatesWithExercisesQuery += " 	wkte.exercise_order AS order, ";
workoutsTemplatesWithExercisesQuery += " 	wkte.exercise_sets AS sets ";
workoutsTemplatesWithExercisesQuery += " FROM workout_template AS wkt ";
workoutsTemplatesWithExercisesQuery +=
  " LEFT JOIN workout_template_exercises AS wkte ON wkt.id = wkte.workout_template_id ";
workoutsTemplatesWithExercisesQuery +=
  " LEFT JOIN exercises AS ex ON wkte.exercise_id = ex.id ";
workoutsTemplatesWithExercisesQuery += " WHERE TRUE ";
workoutsTemplatesWithExercisesQuery +=
  " ORDER BY wkt.id, wkte.exercise_order; ";

const queryNoExercises =
  "SELECT id, name, description FROM " + TABLE_NAME + " WHERE id = $1;";

const _compactWorkoutTemplateInfo = (workoutTemplateInfoDb) => {
  // workoutTemplateInfoDb represents all rows in the table modeling a workout template
  const firstRow = workoutTemplateInfoDb[0];

  const workoutTemplateSpec = {
    id: firstRow.id,
    name: firstRow.name,
    description: firstRow.description,
    exercises: [],
  };

  workoutTemplateInfoDb.forEach((row) => {
    workoutTemplateSpec.exercises.push({
      id: row.exercise_id,
      name: row.exercise_name,
      sets: row.sets,
      order: row.order,
    });
  });

  return workoutTemplateSpec;
};

const selectAllWorkoutsTemplates = () => {
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
      const distinctWorkoutTemplatesIds = [
        ...new Set(
          everyWorkoutTemplate.map((template) => {
            return template.workout_template_id;
          })
        ),
      ];

      if (distinctWorkoutTemplatesIds.length === 0) {
        resolve([]);
      }

      distinctWorkoutTemplatesIds.forEach((workoutTemplateId) => {
        const templateInfo = everyWorkoutTemplate.filter((wk) => {
          return wk.workout_template_id === workoutTemplateId;
        });

        const workoutTemplateSpec = _compactWorkoutTemplateInfo(templateInfo);

        allTemplatesFormatted.push(workoutTemplateSpec);
      });

      resolve(allTemplatesFormatted);
    });
  });
};

const selectWorkoutTemplateById = async (id) => {
  const templateExists = await checkWorkoutTemplateByIdExists(id);

  if (!templateExists) {
    return new Promise((resolve) => {
      resolve(undefined);
    });
  }

  // This info is needed because if the template does not have any exercise, then it won't
  // appear in the main query
  const templateHasExercises = await _checkWorkoutTemplateContainsExercises(id);

  let q;

  if (!templateHasExercises) {
    q = queryNoExercises;
  } else {
    q = workoutsTemplatesWithExercisesQuery.replace(
      "WHERE TRUE",
      "WHERE wkt.id = $1"
    );
  }

  const params = [id];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const templateInfo = results.rows;

      // If workout does not exists
      if (templateInfo.length === 0) {
        return resolve(undefined);
      }

      // Group results by workout id
      const templateSpec = _compactWorkoutTemplateInfo(templateInfo);

      if (!templateHasExercises) {
        templateSpec.exercises = [];
      }

      resolve(templateSpec);
    });
  });
};

const createWorkoutTemplate = ({ userId, name, description }) => {
  // Build query
  let requiredFields = ["user_id", "name"];
  let requiredValues = [userId, name];

  let optionalFields = ["description"];
  let optionalValues = [description];

  let returningFields = ["id", "user_id", "name", "description"];

  const { q, params } = qh.createInsertIntoTableStatement(
    TABLE_NAME,
    requiredFields,
    requiredValues,
    optionalFields,
    optionalValues,
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const createdWorkoutTemplate = results.rows[0];
      const specWorkoutTemplate = {
        ...createdWorkoutTemplate,
        userId: createdWorkoutTemplate.user_id,
      };

      delete specWorkoutTemplate.user_id;

      resolve(specWorkoutTemplate);
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

const addExerciseToWorkoutTemplate = ({
  workoutTemplateId,
  exerciseId,
  exerciseOrder,
  exerciseSets,
}) => {
  // Build query
  let requiredFields = [
    "workout_template_id",
    "exercise_id",
    "exercise_order",
    "exercise_sets",
  ];
  let requiredValues = [
    workoutTemplateId,
    exerciseId,
    exerciseOrder,
    exerciseSets,
  ];

  let optionalFields = [];
  let optionalValues = [];

  let returningFields = [
    "workout_template_id",
    "exercise_id",
    "exercise_order",
    "exercise_sets",
  ];

  const { q, params } = qh.createInsertIntoTableStatement(
    "workout_template_exercises",
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

      const specExercise = {
        workoutTemplateId: addedExercise.workout_template_id,
        exerciseId: addedExercise.exercise_id,
        exerciseOrder: addedExercise.exercise_order,
        exerciseSets: addedExercise.exercise_sets,
      };

      resolve(specExercise);
    });
  });
};

const checkWorkoutTemplateByIdExists = async (id) => {
  let q = "SELECT id FROM " + TABLE_NAME + " WHERE id = $1;";
  const params = [id];

  const selectedTemplate = await new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const template = results.rows[0];
      resolve(template);
    });
  });

  if (!selectedTemplate) {
    return false;
  }

  // check selectedTemplate.id is an UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (!selectedTemplate.id.match(uuidRegex)) {
    return false;
  }

  return true;
};

const workoutTemplateBelongsToUser = (templateId, userId) => {
  const q = "SELECT * FROM " + TABLE_NAME + " WHERE id = $1 AND user_id = $2;";
  const params = [templateId, userId];

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

const _checkWorkoutTemplateContainsExercises = async (templateId) => {
  let q =
    "SELECT exercise_id FROM workout_template_exercises WHERE workout_template_id = $1;";
  const params = [templateId];

  const selectedTemplate = await new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const template = results.rows[0];
      resolve(template);
    });
  });

  if (!selectedTemplate) {
    return false;
  }

  // check selectedTemplate.exercise_id is UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (!selectedTemplate.exercise_id.match(uuidRegex)) {
    return false;
  }

  return true;
};

const updateWorkoutTemplate = async (id, workoutTemplateObject) => {
  const client = await getPoolClient();
  const hasExercises = await _checkWorkoutTemplateContainsExercises(id);

  let results;

  try {
    await client.query("BEGIN;");

    // Update workout template
    const { q: updateQuery, params: updateParams } =
      qh.createUpdateTableStatement(TABLE_NAME, id, workoutTemplateObject);

    await client.query(updateQuery, updateParams);

    let returnInfoQuery;

    if (hasExercises) {
      returnInfoQuery = workoutsTemplatesWithExercisesQuery.replace(
        "WHERE TRUE",
        "WHERE wkt.id = $1"
      );
    } else {
      returnInfoQuery = queryNoExercises;
    }
    const returnInfoParams = [id];

    results = await client.query(returnInfoQuery, returnInfoParams);
    await client.query("COMMIT;");
  } catch (e) {
    await client.query("ROLLBACK;");
    throw e;
  } finally {
    client.release();
  }

  const workoutTemplateInfo = results.rows;

  // If workout template does not exists
  if (workoutTemplateInfo.length === 0) {
    return undefined;
  }

  // Group results by workout template id
  const workoutTemplateSpec = _compactWorkoutTemplateInfo(workoutTemplateInfo);

  if (!hasExercises) {
    workoutTemplateSpec.exercises = [];
  }

  return workoutTemplateSpec;
};

const deleteWorkoutTemplate = async (id) => {
  // TODO WARNING: There's a potencial risk of unreferenced items in workout_template_exercises?
  const client = await getPoolClient();
  const hasExercises = await _checkWorkoutTemplateContainsExercises(id);

  let templateInfo;

  try {
    await client.query("BEGIN;");

    // Get info to be deleted to return it to user
    let infoQuery;
    if (hasExercises) {
      infoQuery = workoutsTemplatesWithExercisesQuery.replace(
        "WHERE TRUE",
        "WHERE wkt.id = $1"
      );
    } else {
      infoQuery = queryNoExercises;
    }

    const infoParams = [id];
    templateInfo = await client.query(infoQuery, infoParams);

    // Delete references in workouts_exercises
    const templateExercisesQuery =
      "DELETE FROM workout_template_exercises WHERE workout_template_id = $1;";
    const templateExercisesParams = [id];
    await client.query(templateExercisesQuery, templateExercisesParams);

    // Delete references in users_workouts
    const usersWorkoutsQuery = `
            DELETE FROM users_workouts
            WHERE workout_id IN (
                SELECT w.id
                FROM workouts w
                WHERE w.template_id = $1
            );
        `;
    const usersWorkoutsParams = [id];
    await client.query(usersWorkoutsQuery, usersWorkoutsParams);

    // Delete references in workouts_exercises
    const workoutsExercisesQuery = `
            DELETE FROM workouts_exercises
            WHERE workout_id IN (
                SELECT w.id
                FROM workouts w
                WHERE w.template_id = $1
            );
        `;
    const workoutsExercisesParams = [id];
    await client.query(workoutsExercisesQuery, workoutsExercisesParams);

    // Delete references in workouts
    const workoutsQuery = "DELETE FROM workouts WHERE template_id = $1;";
    const workoutsParams = [id];
    await client.query(workoutsQuery, workoutsParams);

    // Delete template itself
    const templatesQuery =
      "DELETE FROM " +
      TABLE_NAME +
      " WHERE id = $1 " +
      "RETURNING id, name, description;";
    const templatesParams = [id];
    await client.query(templatesQuery, templatesParams);

    await client.query("COMMIT;");
  } catch (e) {
    await client.query("ROLLBACK;");
    throw e;
  } finally {
    client.release();
  }

  // Get results from query
  templateInfo = templateInfo.rows;

  // If workout does not exists
  if (templateInfo.length === 0) {
    return undefined;
  }

  // Group results by workout id
  const workoutSpec = _compactWorkoutTemplateInfo(templateInfo);

  if (!hasExercises) {
    workoutSpec.exercises = [];
  }

  return workoutSpec;
};

const checkExerciseInWorkoutTemplateExists = async (
  templateId,
  exerciseId,
  exerciseOrder
) => {
  let q =
    "SELECT workout_template_id FROM workout_template_exercises WHERE workout_template_id = $1 AND exercise_id = $2 AND exercise_order = $3;";
  const params = [templateId, exerciseId, exerciseOrder];

  const selectedWorkoutTemplate = await new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const workoutTemplateId = results.rows[0];
      resolve(workoutTemplateId);
    });
  });

  if (!selectedWorkoutTemplate) {
    return false;
  }

  // Check if selectedWorkoutTemplate.workout_template_id is an UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (!selectedWorkoutTemplate.workout_template_id.match(uuidRegex)) {
    return false;
  }

  return true;
};

const updateExerciseFromWorkoutTemplate = (
  workoutTemplateId,
  exerciseOrder,
  { exerciseId, exerciseSets, newExerciseOrder }
) => {
  // If theres is nothing to update, then do nothing
  if (
    exerciseId === undefined &&
    exerciseSets === undefined &&
    newExerciseOrder === undefined
  ) {
    return;
  }

  const fieldsToUpdate = {
    exercise_order: newExerciseOrder,
    exercise_sets: exerciseSets,
  };

  let paramDolarCounter = 1;

  // Build query
  const params = [];
  let q = "UPDATE workout_template_exercises SET ";

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
  q += `workout_template_id = $${paramDolarCounter} AND `;
  q += `exercise_id = $${paramDolarCounter + 1} AND `;
  q += `exercise_order = $${paramDolarCounter + 2} `;
  q +=
    "RETURNING  " +
    "	workout_template_id,  " +
    "	exercise_id,  " +
    "	exercise_order,  " +
    "	exercise_sets;  ";

  params.push(workoutTemplateId);
  params.push(exerciseId);
  params.push(exerciseOrder);

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const updatedExercise = results.rows[0];
      const updatedExerciseSpec = {
        workoutTemplateId: updatedExercise.workout_template_id,
        exerciseId: updatedExercise.exercise_id,
        exerciseOrder: updatedExercise.exercise_order,
        exerciseSets: updatedExercise.exercise_sets,
      };
      resolve(updatedExerciseSpec);
    });
  });
};

const deleteExerciseFromWorkoutTemplate = (
  workoutId,
  exerciseId,
  exerciseOrder
) => {
  const q =
    " WITH deleted AS ( " +
    " 	DELETE FROM workout_template_exercises " +
    " 	WHERE " +
    " 		workout_template_id = $1 AND " +
    " 		exercise_id = $2 AND " +
    " 		exercise_order = $3 " +
    " 	RETURNING  " +
    " 		workout_template_id, " +
    " 		exercise_id, " +
    " 		exercise_order, " +
    " 		exercise_sets " +
    " ) " +
    " SELECT * FROM deleted " +
    " ORDER BY exercise_id, exercise_order; ";

  const params = [workoutId, exerciseId, exerciseOrder];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const exercisesRows = results.rows;
      const exercisesSpec = [];

      exercisesRows.forEach((row) => {
        exercisesSpec.push({
          workoutTemplateId: row.workout_template_id,
          exerciseId: row.exercise_id,
          exerciseSets: row.exercise_sets,
          exerciseOrder: row.exercise_order,
        });
      });

      resolve(exercisesSpec);
    });
  });
};

const selectWorkoutTemplatesByUserId = (userId) => {
  const q = workoutsTemplatesWithExercisesQuery.replace(
    "WHERE TRUE",
    `WHERE wkt.user_id = $1`
  );
  const params = [userId];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);
      const everyWorkoutTemplate = results.rows;

      const allTemplatesFormatted = [];

      // Group results by template id
      // Get unique templates ids
      // DOCS: Source https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript
      const distinctWorkoutTemplatesIds = [
        ...new Set(
          everyWorkoutTemplate.map((template) => {
            return template.id;
          })
        ),
      ];

      if (distinctWorkoutTemplatesIds.length === 0) {
        resolve([]);
      }

      distinctWorkoutTemplatesIds.forEach((workoutTemplateId) => {
        const templateInfo = everyWorkoutTemplate.filter((wk) => {
          return wk.id === workoutTemplateId;
        });

        const workoutTemplateSpec = _compactWorkoutTemplateInfo(templateInfo);

        allTemplatesFormatted.push(workoutTemplateSpec);
      });

      resolve(allTemplatesFormatted);
    });
  });
};

const selectCommonWorkoutTemplates = async () => {
  const commonUser = await userDb.selectUserByEmail(
    process.env.DB_COMMON_USER_EMAIL
  );

  const q = workoutsTemplatesWithExercisesQuery.replace(
    "WHERE TRUE",
    `WHERE wkt.user_id = $1`
  );
  const params = [commonUser.id];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);

      const everyWorkoutTemplate = results.rows;

      const allTemplatesFormatted = [];

      // Group results by template id
      // Get unique templates ids
      // DOCS: Source https://stackoverflow.com/questions/15125920/how-to-get-distinct-values-from-an-array-of-objects-in-javascript
      const distinctWorkoutTemplatesIds = [
        ...new Set(
          everyWorkoutTemplate.map((template) => {
            return template.id;
          })
        ),
      ];

      if (distinctWorkoutTemplatesIds.length === 0) {
        resolve([]);
      }

      distinctWorkoutTemplatesIds.forEach((workoutTemplateId) => {
        const templateInfo = everyWorkoutTemplate.filter((wk) => {
          return wk.id === workoutTemplateId;
        });

        const workoutTemplateSpec = _compactWorkoutTemplateInfo(templateInfo);

        allTemplatesFormatted.push(workoutTemplateSpec);
      });

      resolve(allTemplatesFormatted);
    });
  });
};

const selectIdDateAndNameFromLastPerformedTemplatesByUser = async (
  userId,
  numberOfWOrkouts
) => {
  const commonUser = await userDb.selectUserByEmail(
    process.env.DB_COMMON_USER_EMAIL
  );

  const q = `
        SELECT
        	wt.id AS template_id,
        	uw.start_date AT TIME ZONE 'UTC' AS workout_date,
        	wt.name AS workout_name
        FROM workouts w
        JOIN users_workouts uw ON w.id = uw.workout_id
        JOIN workout_template wt ON w.template_id = wt.id
        WHERE uw.user_id = $1 OR uw.user_id = $3
        ORDER BY start_date DESC
        LIMIT $2;
    `;

  const params = [userId, numberOfWOrkouts, commonUser.id];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) reject(error);
      const lastWorkoutTemplates = results.rows;

      if (lastWorkoutTemplates.length === 0) {
        resolve([]);
      }

      resolve(lastWorkoutTemplates);
    });
  });
};

module.exports = {
  selectAllWorkoutsTemplates,
  selectWorkoutTemplateById,
  selectWorkoutTemplatesByUserId,
  selectCommonWorkoutTemplates,
  selectIdDateAndNameFromLastPerformedTemplatesByUser,
  createWorkoutTemplate,
  truncateTableTest,
  addExerciseToWorkoutTemplate,
  checkWorkoutTemplateByIdExists,
  workoutTemplateBelongsToUser,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  checkExerciseInWorkoutTemplateExists,
  updateExerciseFromWorkoutTemplate,
  deleteExerciseFromWorkoutTemplate,
};
