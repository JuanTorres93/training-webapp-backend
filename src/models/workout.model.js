const { DataTypes } = require("sequelize");

module.exports = (sequelize, { WorkoutTemplateModel }) => {
  const Workout = sequelize.define(
    "Workout",
    {
      id: {
        primaryKey: true, // NOTE Shared with the date field
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
        allowNull: false,
      },
      template_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkoutTemplateModel, // Model of the referenced table
          key: "id",
        },
      },
      description: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: "workouts", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  Workout._getGenericQueryWorkoutWithExercises = function () {
    return `
      SELECT   
         wk.id AS workout_id,	 
         wkt.id AS workout_template_id,	 
         wkt.name AS workout_name,	 
         wk.description AS workout_description, 	 
         e.id AS exercise_id, 	 
         e.name AS exercise_name, 	 
         w_e.exercise_set AS exercise_set, 	 
         w_e.exercise_reps AS exercise_reps, 	 
         w_e.exercise_weight AS exercise_weight, 	 
         w_e.exercise_time_in_seconds AS exercise_time_in_seconds 	 
      FROM workouts  
       AS wk  
      LEFT JOIN workout_template as wkt ON wk.template_id = wkt.id    
      LEFT JOIN workouts_exercises AS w_e ON wk.id = w_e.workout_id  
      LEFT JOIN exercises AS e ON w_e.exercise_id = e.id  
      WHERE TRUE  -- This condition is here for DRYING the code replacing it where necessary
      ORDER BY workout_id, exercise_id, exercise_set  
      ;
    `;
  };

  Workout._compactWorkoutInfo = function (workoutInfoDb) {
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
      if (!row.exercise_id) return;

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

  Workout.getWorkoutByIdSpec = async function (workoutId) {
    const q = Workout._getGenericQueryWorkoutWithExercises().replace(
      "WHERE TRUE",
      "WHERE wk.id = :workoutId"
    );

    const results = await sequelize.query(q, {
      replacements: { workoutId },
    });

    const workout = results[0];

    return Workout._compactWorkoutInfo(workout);
  };

  return Workout;
};
