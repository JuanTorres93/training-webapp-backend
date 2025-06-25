const { DataTypes } = require("sequelize");

module.exports = (sequelize, { WorkoutTemplateModel, ExerciseModel }) => {
  const WorkoutTemplateExercises = sequelize.define(
    "WorkoutTemplateExercises",
    {
      workout_template_id: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkoutTemplateModel, // Model of the referenced table
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
      exercise_order: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      exercise_sets: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // TODO Valitade to greater than 0
      },
    },
    {
      tableName: "workout_template_exercises", // Explicitly specify the table name
      timestamps: false,
    }
  );

  return WorkoutTemplateExercises;
};
