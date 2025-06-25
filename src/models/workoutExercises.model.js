const { DataTypes } = require("sequelize");

module.exports = (sequelize, { WorkoutModel, ExerciseModel }) => {
  const WorkoutExercises = sequelize.define(
    "WorkoutExercises",
    {
      workout_id: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkoutModel, // Model of the referenced table
          key: "id",
        },
      },
      exercise_id: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: ExerciseModel, // Model of the referenced table
          key: "id",
        },
      },
      exercise_set: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      exercise_reps: {
        type: DataTypes.INTEGER,
      },
      exercise_weight: {
        type: DataTypes.DECIMAL,
      },
      exercise_time_in_seconds: {
        type: DataTypes.INTEGER,
      },
      notes: {
        type: DataTypes.STRING(400),
      },
    },
    {
      tableName: "workouts_exercises", // Explicitly specify the table name
      timestamps: false,
    }
  );

  return WorkoutExercises;
};
